class MenuPage extends HTMLElement {
    constructor() {
        super();

        const shadowDOM = this.attachShadow({ mode: 'open' });

        shadowDOM.innerHTML = `
            <style>
            .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #ffffff;
            padding: 12px 20px;
            border-bottom: 1px solid #e0e0e0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }

            .nav-left {
            display: flex;
            gap: 10px;
            align-items: center;
            }

            /* Estilos dos Botões Dropdown */
            .dropdown {
            position: relative;
            display: inline-block;
            }

            .btn-nav {
            padding: 13px 16px;
            font-size: 14px;
            font-weight: 500;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: opacity 0.2s ease;
            text-decoration: none;
            }

            .btn-nav:hover {
            opacity: 0.9;
            }

            /* Cores Exatas da Imagem */
            .btn-cadastros {
            background-color: #0b5ed7; /* Azul Bootstrap */
            color: #ffffff;
            }

            .btn-manutencao {
            background-color: #d3a009; /* Amarelo Bootstrap */
            color: #ffffff;
            }

            .btn-home{
            background-color: #6607ff;
            color: #ffff}

            .btn-orcamento {
            background-color: #198754; /* Verde Bootstrap */
            color: #ffffff;
            }

            .btn-sair {
            background-color: #dc3545; /* Vermelho Bootstrap */
            color: #ffffff;
            }

            .arrow-down {
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            }

            .btn-cadastros .arrow-down {
            border-top: 5px solid #ffffff;
            }

            .btn-manutencao .arrow-down {
            border-top: 5px solid #000000;
            }

            .dropdown-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 0;
            background-color: #ffffff;
            min-width: 160px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            z-index: 1000;
            padding: 6px 0;
            list-style: none;
            }

            .dropdown-menu li a {
            color: #333333;
            padding: 8px 16px;
            text-decoration: none;
            display: block;
            font-size: 14px;
            transition: background-color 0.2s;
            }

            .dropdown-menu li a:hover {
            background-color: #f1f5f9;
            color: #0b5ed7;
            }

            /* Exibir menu ao passar o mouse */
            .dropdown:hover .dropdown-menu {
            display: block;
            }
            </style>

            <nav class="navbar">
                <div class="nav-left">
                    <a href="Home.html" class="btn-nav btn-home">
                        Painel
                    </a>                    
                    <!-- DROPDOWN CADASTROS -->
                    <div class="dropdown">
                        <button type="button" class="btn-nav btn-cadastros">
                            Cadastros <span class="arrow-down"></span>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a href="Cliente.html">Clientes</a></li>
                            <li><a href="Categoria.html">Categorias</a></li>
                            <li><a href="Produto.html">Produtos</a></li>
                        </ul>
                    </div>

                    <!-- DROPDOWN MANUTENÇÃO -->
                    <div class="dropdown">
                        <button type="button" class="btn-nav btn-manutencao">
                            Manutenção <span class="arrow-down"></span>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a href="Usuario.html">Usuários</a></li>
                        </ul>
                    </div>

                    <!-- BOTÃO ORÇAMENTO -->
                    <a href="orcamento.html" class="btn-nav btn-orcamento">
                        Proposta Comercial
                    </a>
                </div>

                <!-- BOTÃO SAIR -->
                <div class="nav-right">
                    <a href="../index.html" class="btn-nav btn-sair">Sair</a>
                </div>
            </nav>
        `;
    }
}

customElements.define('menu-page', MenuPage);
