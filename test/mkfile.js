const fs = require('fs');

function createFileWithSize(filename, sizeInBytes, char = 'a') {
    const charBuffer = Buffer.alloc(1, char); // Cria um buffer com um único caractere
    const chunkSize = 1024; // Tamanho do chunk para escrever no arquivo (1KB)

    const chunksToWrite = Math.ceil(sizeInBytes / chunkSize);
    const remainderSize = sizeInBytes % chunkSize;

    const writeStream = fs.createWriteStream(filename);

    for (let i = 0; i < chunksToWrite; i++) {
        const chunk = i === chunksToWrite - 1 ? charBuffer.slice(0, remainderSize) : charBuffer;
        writeStream.write(chunk);
    }

    writeStream.end();

    writeStream.on('finish', () => {
        console.log(`Arquivo '${filename}' criado com sucesso.`);
    });

    writeStream.on('error', (err) => {
        console.error('Erro ao criar o arquivo:', err);
    });
}

// Exemplo de uso:
const filename = 'arquivo.txt';
const fileSizeInBytes = 1024 * 1024 * 100;
const charToRepeat = 'a';

createFileWithSize(filename, fileSizeInBytes, charToRepeat);