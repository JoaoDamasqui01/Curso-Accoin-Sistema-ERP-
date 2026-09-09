class MenuPage extends HTMLElement {
  constructor() {
    super();

    const shadowDOM = this.attachShadow({ mode: 'open' });

    shadowDOM.innerHTML = `
      <style>
        /* Base e Reset */
        * {
          box-sizing: border-box;
        }

        /* -------------------------------------------
           1. ESTILOS DESKTOP (Padrão: Menu Fixo Lateral)
           ------------------------------------------- */
        .btn-hamburguer {
          display: none; /* Escondido no Desktop */
        }

        .menu-overlay {
          display: none; /* Não é necessário Overlay no Desktop */
        }

        .menu-lateral {
          position: fixed;
          top: 0;
          left: 0;
          width: 316px;
          height: 100vh;
          background-color: #172b3a;
          color: #ffffff;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 12px rgba(0,0,0,0.15);
          font-family: Arial, sans-serif;
        }

        .btn-fechar {
          display: none; /* Oculta o 'X' no modo desktop fixo */
        }

        /* Cabeçalho do Menu */
        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Container da Logo + Texto */
        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px; /* Espaçamento entre a imagem e o texto */
        }

        .logo-menu-image {
          width: 58px;
          height: 58px;
          object-fit: contain;
        }

        .menu-header h2 {
          margin: 0;
          font-size: 20px;
          color: #ffffff;
        }

        /* Links do Menu */
        .menu-corpo {
          flex: 1;
          overflow-y: auto;
          padding: 15px 0;
        }

        .secao-titulo {
          padding: 10px 20px 5px 20px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #718096;
          font-weight: bold;
        }

        .menu-corpo a {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: #e2e8f0;
          text-decoration: none;
          font-size: 20px;
          transition: background-color 0.2s, color 0.2s;
        }

        .menu-corpo a:hover {
          background-color: rgba(255, 255, 255, 0.08);
          color: #b7d63a;
        }

        /* Rodapé Fixado no Fim */
        .menu-footer {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-sair {
          display: block;
          width: 100%;
          padding: 12px;
          background-color: #dc3545;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          text-align: center;
          text-decoration: none;
          font-size: 14px;
          font-weight: bold;
          transition: background-color 0.2s;
        }

        .btn-sair:hover {
          background-color: #bb2d3b;
        }

        /* -------------------------------------------
           2. ESTILOS MOBILE (Telas menores que 768px)
           ------------------------------------------- */
        @media (max-width: 7680px) {
          /* Botão Hambúrguer Fixo */
          .btn-hamburguer {
            display: flex;
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1000;
            background-color: #172b3a;
            color: #ffffff;
            border: none;
            padding: 10px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 20px;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: background-color 0.2s ease;
          }

          .btn-hamburguer:hover {
            background-color: #243746;
          }

          /* Overlay para fechar ao clicar fora */
          .menu-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.4);
            z-index: 1001;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
          }

          .menu-overlay.aberto {
            opacity: 1;
            visibility: visible;
          }

          /* Menu Recuado (Offcanvas) no Mobile */
          .menu-lateral {
            left: -316px;
            width: 316px;
            z-index: 1002;
            transition: left 0.3s ease-in-out;
          }

          .menu-lateral.aberto {
            left: 0;
          }

          /* Exibe o botão de fechar 'X' apenas no Mobile */
          .btn-fechar {
            display: block;
            background: none;
            border: none;
            color: #a0aec0;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
          }

          .btn-fechar:hover {
            color: #ffffff;
          }
        }
      </style>

      <!-- Botão Hambúrguer (Mobile) -->
      <button class="btn-hamburguer" id="btnToggle" aria-label="Abrir Menu">☰</button>

      <!-- Overlay (Mobile) -->
      <div class="menu-overlay" id="overlay"></div>

      <!-- Menu Lateral -->
      <aside class="menu-lateral" id="sidebar">
        <div class="menu-header">
          <div class="header-brand">
            <img src="../Imagem/dittoFlow.png" alt="Logo DittoFlow" class="logo-menu-image">
            <h2>DittoFlow - ERP</h2>
          </div>
          <button class="btn-fechar" id="btnFechar">✕</button>
        </div>

        <nav class="menu-corpo">
          <a href="Home.html">📌 Painel Principal</a>

          <div class="secao-titulo">Cadastros</div>
          
          <a href="Cliente.html">👥 Clientes</a>
          <a href="Categoria.html">🏷️ Categorias</a>
          <a href="Produto.html">🎨 Produtos</a>

          <div class="secao-titulo">Manutenção</div>
          <a href="Usuario.html">⚙️ Usuários</a>

          <div class="secao-titulo">Comercial</div>
          <a href="Orcamento.html">📄 Proposta Comercial</a>
        </nav>

        <div class="menu-footer">
          <a href="Login.html" class="btn-sair" id="btnSair">🚪 Sair</a>
        </div>
      </aside>
    `;

    // Lógica de abertura e fechamento
    const sidebar = shadowDOM.getElementById('sidebar');
    const overlay = shadowDOM.getElementById('overlay');
    const btnToggle = shadowDOM.getElementById('btnToggle');
    const btnFechar = shadowDOM.getElementById('btnFechar');
    const btnSair = shadowDOM.getElementById('btnSair'); // <-- Seleciona o botão Sair

    const toggleMenu = () => {
      sidebar.classList.toggle('aberto');
      overlay.classList.toggle('aberto');
    };

    btnToggle.addEventListener('click', toggleMenu);
    btnFechar.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // --- LÓGICA DE SAIR DA SESSÃO ---
    btnSair.addEventListener('click', (event) => {
      event.preventDefault(); // Impede a navegação simples do link <a>

      // 1. Destrói a sessão armazenada
      sessionStorage.removeItem('usuarioLogado');
      sessionStorage.clear();
      localStorage.clear();

      // 2. Redireciona para o login substituindo a página atual no histórico
      window.location.replace('Login.html');
    });
  }
}
customElements.define('menu-page', MenuPage);