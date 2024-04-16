const readlineSync = require('readline-sync');
const fs = require('fs');
const lz4 = require('lz4');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

class FileHandler {
    constructor(outputPath) {
        this.chunkSize = 2024 * 1024 * 10; // Tamanho inicial dos pedaços
        this.chunkData = []; // Array para guardar os endereços e pedaços comprimidos
        this.outputPath = outputPath || './'; // Caminho de saída para os arquivos
    }

    async compressAndSave(filePath, useMemory = false) {
        try {
            // Verificar se o caminho de saída existe e criar se não existir
            await this.createOutputDirectory();

            const fileContent = await readFileAsync(filePath);
            const fileSize = fileContent.length;

            this.chunkData = []; // Limpa o array antes de começar a comprimir um novo arquivo

            let remainingSize = fileSize;
            let start = 0;

            // Loop para dividir o arquivo em pedaços
            while (remainingSize > 0) {
                const end = Math.min(start + this.chunkSize, fileSize);
                const chunk = fileContent.slice(start, end);

                // Cria um hash SHA-256 baseado no conteúdo do pedaço para verificar a integridade
                const hash = crypto.createHash('sha256').update(chunk).digest('hex');
                
                // Comprimir o pedaço usando LZ4
                const compressedChunk = lz4.encode(chunk);

                // Gerar um endereço hexadecimal único para o pedaço
                const address = uuidv4().replace(/-/g, '');

                // Salvar o pedaço comprimido em um arquivo temporário
                const tempFileName = `${this.outputPath}${address}.bin`;
                await writeFileAsync(tempFileName, compressedChunk);

                this.chunkData.push({
                    address,
                    hash,
                    size: compressedChunk.length,
                    fileName: tempFileName
                });

                // Atualizar os valores para o próximo pedaço
                start += this.chunkSize;
                remainingSize -= this.chunkSize;
            }

            // Salvar o índice de endereços em um arquivo binário
            const indexData = this.chunkData.map(chunk => Buffer.from(chunk.address, 'hex'));
            await writeFileAsync(`${this.outputPath}index.bin`, Buffer.concat(indexData));

            // Se a opção de trabalhar em memória estiver ativada, comprimir tudo em um arquivo zip
            if (useMemory) {
                await this.createZipArchive();
            }

            console.log('Arquivos comprimidos e endereços salvos com sucesso.');
        } catch (err) {
            console.error('Erro ao comprimir e salvar os arquivos:', err);
        }
    }

    async createOutputDirectory() {
        try {
            await mkdirAsync(this.outputPath, { recursive: true });
        } catch (err) {
            console.error('Erro ao criar o diretório de saída:', err);
            throw err;
        }
    }

    async createZipArchive() {
        const zipFileName = `${this.outputPath}chunks.zip`;
        const zip = new AdmZip();

        // Adiciona os chunks ao arquivo zip
        for (const chunk of this.chunkData) {
            zip.addLocalFile(chunk.fileName);
        }

        zip.writeZip(zipFileName);

        console.log('Arquivo zip criado com sucesso.');
    }

    async deletechunks() {
        let indice = await readFileAsync(`${this.outputPath}index.bin`);
        let chunks = [];
        // Apaga os chunks
        for (let i = 0; i < indice.length; i += 16) {
            chunks.push(indice.slice(i, i + 16).toString('hex'));
        }
        for (let i = 0; i < chunks.length; i++) {
            fs.unlinkSync(`${this.outputPath}${chunks[i]}.bin`);
        }
    }

    async decompressAndRead() {
        try {
            // Ler os índices de endereços
            const indicesData = await readFileAsync(`${this.outputPath}index.bin`);
            const chunkAddresses = [];

            // Extrair os endereços hexadecimais do índice
            for (let i = 0; i < indicesData.length; i += 16) {
                chunkAddresses.push(indicesData.slice(i, i + 16).toString('hex'));
            }

            // Array para guardar os pedaços descomprimidos
            const decompressedChunks = [];

            // Remontar os dados descomprimindo os pedaços
            for (const address of chunkAddresses) {
                const fileName = `${this.outputPath}${address}.bin`;
                const compressedChunk = await readFileAsync(fileName);

                // Descomprimir o pedaço usando LZ4
                const decompressedChunk = lz4.decode(compressedChunk);

                // Verificar a integridade do pedaço
                try {
                    const hash = crypto.createHash('sha256').update(decompressedChunk).digest('hex');
                    const chunkData = this.chunkData.find(chunk => chunk.address === address);

                    if (hash !== chunkData.hash) {
                        throw new Error(`Hash do pedaço ${address} não corresponde ao hash original.`);
                    }
                }
                catch (err) {
                    throw new Error(`Erro ao verificar a integridade do pedaço ${address}: ${err.message}`);
                    return;
                }

                // Adicionar o pedaço descomprimido ao array
                decompressedChunks.push(decompressedChunk);

                // Remover o arquivo temporário
                await unlinkAsync(fileName);
            }

            // Se estiver usando memória, descompacta o arquivo zip e remove os chunks temporários
            if (fs.existsSync(`${this.outputPath}chunks.zip`)) {
                await this.extractZipArchive(`${this.outputPath}chunks.zip`);
                await unlinkAsync(`${this.outputPath}chunks.zip`);
            }

            // Combinar os pedaços em um único Buffer
            const reconstructedData = Buffer.concat(decompressedChunks);

            console.log('Dados remontados com sucesso.');
            return reconstructedData.toString();
        } catch (err) {
            console.error('Erro ao remontar os dados:', err);
        }
    }

    async extractZipArchive(zipFilePath) {
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(this.outputPath, true);
    }

    // Zipa um arquivo de entrada e retorna como buffer
    async zipFileImput(filePath) {
        const zip = new AdmZip();
        zip.addLocalFile(filePath);
        return zip.toBuffer();
    }

    // Deszipa um buffer e salva em um arquivo
    async unzipBuffer(buffer, fileName) {
        const zip = new AdmZip(buffer);
        zip.extractAllTo(this.outputPath, true);
    }
}

// ------------------------------------------------------------------------------------------------------


function showMenu() {
    console.log('Bem-vindo à interface interativa!');
    console.log('Escolha uma opção:');
    console.log('1. Comprimir arquivo');
    console.log('2. Descomprimir arquivo');
    console.log('3. Sair');
}

/*
// Exemplo de uso:
const fileHandler = new FileHandler('./output/');

// Comprimir e salvar o arquivo
fileHandler.compressAndSave('test.jpg', true).then(() => {
    fileHandler.decompressAndRead().then((data) => {
        fs.writeFileSync(`${fileHandler.outputPath}arquivo_descomprimido.jpg`, data);
    });
});
*/

async function compressFile(fileHandler) {
    const filePath = readlineSync.question('Digite o caminho do arquivo a ser comprimido: ');

    try {
        await fileHandler.compressAndSave(filePath);
        console.log('Arquivo comprimido com sucesso.');
    } catch (err) {
        console.error('Erro ao comprimir o arquivo:', err);
    }
}

async function decompressFile(fileHandler) {
    try {
        const data = await fileHandler.decompressAndRead();
        const extension = readlineSync.question('Digite a extensão do arquivo descomprimido( ignore o . use apenas o nome): ');
        const fileName = readlineSync.question('Digite o nome do arquivo descomprimido: ');
        const destiny = readlineSync.question('Digite o caminho de destino do arquivo descomprimido: ');

        await writeFileAsync(`${destiny}${fileName}.${extension}`, data);
        console.log('Arquivo descomprimido com sucesso.');
    } catch (err) {
        console.error('Erro ao descomprimir o arquivo:', err);
    }
}


async function main() {
    let option = 0;
    const fileHandler = new FileHandler('./output/');

    while (option !== 3) {
        showMenu();
        option = readlineSync.questionInt('Digite a opcao desejada: ');

        switch (option) {
            case 1:
                await compressFile(fileHandler);
                break;
            case 2:
                await decompressFile(fileHandler);
                break;
            case 3:
                console.log('Saindo...');
                break;
            default:
                console.log('Opção inválida.');
        }
    }
}

main();