class MenuPage extends HTMLElement {
  constructor() {
    super();

    const shadowDOM = this.attachShadow({ mode: 'open' });

    shadowDOM.innerHTML = `
      <style>
        /* Botão Hambúrguer Fixo no Topo */
        .btn-hamburguer {
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
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: background-color 0.2s ease;
        }

        .btn-hamburguer:hover {
          background-color: #243746;
        }

        /* Fundo de Sobreposição Escuro (Overlay) */
        .menu-overlay {
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

        /* Painel Lateral Offcanvas */
        .menu-lateral {
          position: fixed;
          top: 0;
          left: -280px;
          width: 280px;
          height: 100vh;
          background-color: #172b3a;
          color: #ffffff;
          z-index: 1002;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 12px rgba(0,0,0,0.25);
          transition: left 0.3s ease-in-out;
          font-family: Arial, sans-serif;
        }

        .menu-lateral.aberto {
          left: 0;
        }

        /* Cabeçalho do Menu */
        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .menu-header h2 {
          margin: 0;
          font-size: 18px;
          color: #ffffff;
        }

        .btn-fechar {
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
          font-size: 14px;
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
          box-sizing: border-box;
          transition: background-color 0.2s;
        }

        .btn-sair:hover {
          background-color: #bb2d3b;
        }
      </style>

      <!-- Botão Hambúrguer -->
      <button class="btn-hamburguer" id="btnToggle" aria-label="Abrir Menu">☰</button>

      <!-- Overlay (fundo escuro ao abrir) -->
      <div class="menu-overlay" id="overlay"></div>

      <!-- Menu Lateral -->
      <aside class="menu-lateral" id="sidebar">
        <div class="menu-header">
          <h2>Cor&Gestão</h2>
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
          <a href="Login.html" class="btn-sair">🚪 Sair</a>
        </div>
      </aside>
    `;

    // Lógica para abrir e fechar o menu no Shadow DOM
    const sidebar = shadowDOM.getElementById('sidebar');
    const overlay = shadowDOM.getElementById('overlay');
    const btnToggle = shadowDOM.getElementById('btnToggle');
    const btnFechar = shadowDOM.getElementById('btnFechar');

    const toggleMenu = () => {
      sidebar.classList.toggle('aberto');
      overlay.classList.toggle('aberto');
    };

    btnToggle.addEventListener('click', toggleMenu);
    btnFechar.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
  }
}

customElements.define('menu-page', MenuPage);