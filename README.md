# Sistema de Gestão

Projeto web em HTML, CSS e JavaScript usando Firebase Authentication e Cloud Firestore.

## Estrutura

- `index.html` — interface principal e autenticação.
- `css/style.css` — estilos responsivos.
- `js/firebase.js` — configuração e inicialização do Firebase.
- `js/auth.js` — criação/login/logout/exclusão de contas.
- `js/data.js` — operações de Firestore e transações de estoque/vendas.
- `js/utils.js` — normalização, moeda, datas e mensagens.
- `js/pages/` — páginas Geral, Gastos, Estoque e Vendas.

## Testar no VS Code

Como o projeto usa módulos JavaScript do navegador, abra a pasta em um servidor local (por exemplo, Live Server) em vez de abrir o `index.html` diretamente como `file://`.

## Firebase

O projeto já contém a configuração do Web App Firebase fornecida para este projeto. O Authentication precisa estar com **E-mail/senha** ativado e as regras do Firestore devem ser as regras de segurança definidas para este sistema.

## Login sem e-mail visível

A interface pede somente nome da empresa e senha. Internamente, o código gera um identificador determinístico baseado no nome normalizado para utilizar o provedor E-mail/senha do Firebase Authentication.

## GitHub Pages

1. Envie todos os arquivos para um repositório GitHub.
2. Em **Settings → Pages**, selecione a publicação pelo branch desejado.
3. No Firebase Authentication, adicione o domínio do GitHub Pages em **Authorized domains** quando necessário para o ambiente publicado.

## Observação importante sobre exclusão

A exclusão de uma conta apaga primeiro os documentos das subcoleções `gastos`, `estoque` e `vendas`, depois o documento da empresa e o índice do nome, e por fim exclui o usuário do Firebase Authentication. A senha é solicitada novamente para reautenticação antes da operação.
