# CompressRedux 📦

Este repositório contém uma implementação de um algoritmo de compressão de arquivos baseado em chunks, usando o algoritmo LZ4, e uma abordagem para reconstruir os arquivos a partir dos chunks comprimidos.

## Como funciona? 🤔

O algoritmo de compressão funciona dividindo o arquivo original em pequenos pedaços (chunks), que são comprimidos individualmente usando o algoritmo LZ4. Cada chunk comprimido é então salvo em um arquivo temporário, e um índice de endereços é criado para mapear os chunks comprimidos de volta para o arquivo original.

Para garantir a integridade dos dados, um checksum é adicionado ao índice, permitindo verificar se os chunks foram montados corretamente durante o processo de reconstrução.

```lua
📁 Arquivo Original
   |
   |-----> 🗜️ Compressão (LZ4)
   |             |
   |             |-----> 🗂️ Chunk 1
   |             |
   |             |-----> 🗂️ Chunk 2
   |             |
   |             |-----> 🗂️ ...
   |             |
   |             |-----> 🗂️ Chunk N
   |
   |-----> 🔒 Salvando Índice de Endereços
```

## Estrutura do Repositório 📁

- `main.js`: O arquivo principal que contém a implementação do algoritmo de compressão e salvamento, bem como da reconstrução dos dados.
- `example.txt`: Um exemplo de arquivo de entrada para demonstrar o funcionamento do algoritmo.
- `output/`: Diretório onde os arquivos comprimidos e o índice são salvos.
- `test/`: Diretório de testes com scripts para testar a funcionalidade do algoritmo.

## Uso 🚀

1. Clone o repositório para o seu ambiente local.
2. Execute o arquivo `main.js` para comprimir e salvar um arquivo usando o comando `node main.js`.
3. O arquivo comprimido e o índice serão salvos no diretório `output/`.
4. Para reconstruir o arquivo original, execute novamente o arquivo `main.js`.

## Dependências 🛠️

- `lz4`: Uma biblioteca JavaScript para compressão de dados.
- `uuid`: Uma biblioteca para geração de identificadores únicos.
- `adm-zip`: Uma biblioteca para manipulação de arquivos zip.

## Contribuindo 🤝

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue se encontrar algum problema ou para enviar um pull request com melhorias ou novas funcionalidades.

## Licença 📄


Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
