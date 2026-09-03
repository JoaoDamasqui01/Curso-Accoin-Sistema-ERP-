class MenuPage extends HTMLElement {
    constructor() {
        super();

        const shadowDOM = this.attachShadow({ mode: 'open' });

        shadowDOM.innerHTML = `
            <style>
                .topo-menu {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    padding: 14px clamp(18px, 4vw, 46px);
                    background: #ffffff;
                    border-bottom: 1px solid #e3e9ed;
                    box-shadow: 0 2px 10px rgba(23, 43, 58, .05);
                }

                .menu-esquerda {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 5px;
                }

                .logo-menu {
                    margin-right: 12px;
                    color: #172b3a;
                    font-size: 1rem;
                    font-weight: 800;
                    text-decoration: none;
                }

                .link-menu {
                    padding: 9px 11px;
                    color: #52636f;
                    font-size: .88rem;
                    font-weight: 700;
                    text-decoration: none;
                    border-radius: 7px;
                    transition: color .18s, background-color .18s;
                }

                .link-menu:hover,
                .link-menu:focus-visible {
                    outline: none;
                }

                .link-inicio { color: #17653d; background: #e9f6ed; }
                .link-produtos { color: #175a94; background: #eaf3fb; }
                .link-clientes { color: #815300; background: #fff3d5; }
                .link-categorias { color: #694796; background: #f1eafa; }
                .link-usuarios { color: #9b3e50; background: #fdecef; }

                .link-inicio:hover, .link-inicio:focus-visible { color: #fff; background: #287445; }
                .link-produtos:hover, .link-produtos:focus-visible { color: #fff; background: #216bb3; }
                .link-clientes:hover, .link-clientes:focus-visible { color: #fff; background: #a96d00; }
                .link-categorias:hover, .link-categorias:focus-visible { color: #fff; background: #7753a2; }
                .link-usuarios:hover, .link-usuarios:focus-visible { color: #fff; background: #b5475b; }

                .btn-sair {
                    padding: 9px 13px;
                    color: #a63741;
                    font: 700 .84rem Arial, sans-serif;
                    cursor: pointer;
                    background: #fff;
                    border: 1px solid #efcfd2;
                    border-radius: 7px;
                    transition: background-color .18s, color .18s;
                }

                .btn-sair:hover,
                .btn-sair:focus-visible {
                    color: #ffffff;
                    background: #c94d55;
                    outline: none;
                }

                @media (max-width: 680px) {
                    .topo-menu { align-items: flex-start; }
                    .logo-menu { width: 100%; }
                    .menu-esquerda { gap: 3px; }
                }
            </style>

            <div class="topo-menu">
                <div class="menu-esquerda">
                    <a class="logo-menu" href="Home.html">Accion</a>
                    <a class="link-menu link-inicio" href="Home.html">Início</a>
                    <a class="link-menu link-produtos" href="Produto.html">Produtos</a>
                    <a class="link-menu link-clientes" href="Cliente.html">Clientes</a>
                    <a class="link-menu link-categorias" href="Categoria.html">Categorias</a>
                    <a class="link-menu link-usuarios" href="usuarios.html">Usuários</a>
                </div>

                <a href="login.html"><button type="button" class="btn-sair">Sair</button></a>
            </div>
        `;
    }
}

customElements.define('menu-page', MenuPage);
