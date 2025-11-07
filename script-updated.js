// Estado Global - Sistema funciona com localStorage
let carrinho = []
let caixaAtual = null
const usuarioAtual = { email: "sistema@labella.com" }
let filtroRelatorioAtual = "hoje"
let descontoAtual = 0
let clienteVendaAtual = null
let clienteEmEdicao = null

// Dados em localStorage
let clientes = JSON.parse(localStorage.getItem("clientes")) || []
let produtos = JSON.parse(localStorage.getItem("produtos")) || []
const vendas = JSON.parse(localStorage.getItem("vendas")) || []
const caixas = JSON.parse(localStorage.getItem("caixas")) || []
const movimentacoes = JSON.parse(localStorage.getItem("movimentacoes")) || []

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  await inicializarApp()
})

async function inicializarApp() {
  await verificarCaixaAberto()
  await carregarClientes()
  await carregarProdutos()
  await carregarHistoricoCaixas()
  await carregarMovimentacoes()
  await carregarRelatorios()
  iniciarRelogio()
  carregarClientesNoSelect()

  document.getElementById("searchCliente").addEventListener("input", filtrarClientes)
  adicionarFormatacaoTelefone()
}

// Relógio
function iniciarRelogio() {
  function atualizarRelogio() {
    const now = new Date()
    const options = {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
    const timeString = now.toLocaleString("pt-BR", options)
    document.getElementById("relogioTime").textContent = timeString
  }
  atualizarRelogio()
  setInterval(atualizarRelogio, 1000)
}

// Navegação
function changeTab(tabName) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
  })
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active")
  })

  document.getElementById(tabName).classList.add("active")
  event.target.classList.add("active")

  if (tabName === "produtos") carregarProdutos()
  if (tabName === "clientes") carregarClientes()
  if (tabName === "caixa") {
    verificarCaixaAberto()
    carregarHistoricoCaixas()
  }
  if (tabName === "movimentacoes") carregarMovimentacoes()
  if (tabName === "relatorios") carregarRelatorios()
}

// Formatação
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor)
}

function formatarData(data) {
  return new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatarCPF(valor) {
  valor = valor.replace(/\D/g, "")
  if (valor.length > 11) valor = valor.substring(0, 11)

  if (valor.length <= 3) return valor
  if (valor.length <= 6) return valor.replace(/(\d{3})(\d+)/, "$1.$2")
  if (valor.length <= 9) return valor.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3")
  return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

function formatarCEP(valor) {
  valor = valor.replace(/\D/g, "")
  if (valor.length > 8) valor = valor.substring(0, 8)
  return valor.replace(/(\d{5})(\d+)/, "$1-$2")
}

// Formatação de telefone
function adicionarFormatacaoTelefone() {
  const telefoneInputs = ["clienteTelefone", "clienteRapidoTelefone"]

  telefoneInputs.forEach((inputId) => {
    const input = document.getElementById(inputId)
    if (input) {
      input.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "")
        if (value.length > 0) {
          if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
          } else {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
          }
        }
        e.target.value = value
      })
    }
  })
}

// PDV Functions
function mostrarProdutosDisponíveis() {
  const container = document.getElementById("produtosList")
  container.innerHTML = ""

  produtos.forEach((produto) => {
    if (produto.estoque > 0) {
      const item = document.createElement("div")
      item.className = "produto-item"
      item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>${produto.nome}</strong>
                    <span style="color: #d4af37; font-weight: bold;">${formatarMoeda(produto.preco)}</span>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <small>Código: ${produto.codigo}</small>
                    <small style="color: #2ecc71;">Est: ${produto.estoque}</small>
                </div>
                <button class="btn btn-primary" style="width: 100%; padding: 0.5rem;" onclick="adicionarAoCarrinho('${produto.id}')">
                    <svg class="icon"><use href="#icon-cart"></use></svg>
                    Adicionar
                </button>
            `
      container.appendChild(item)
    }
  })
}

function adicionarAoCarrinho(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId)
  if (!produto) return

  const itemCarrinho = carrinho.find((item) => item.id === produtoId)
  if (itemCarrinho) {
    itemCarrinho.quantidade++
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
    })
  }

  atualizarCarrinho()
}

function atualizarCarrinho() {
  const container = document.getElementById("carrinhoItens")
  container.innerHTML = ""

  let total = 0
  carrinho.forEach((item) => {
    const subtotal = item.preco * item.quantidade
    total += subtotal

    const itemDiv = document.createElement("div")
    itemDiv.className = "carrinho-item"
    itemDiv.innerHTML = `
            <div style="flex: 1;">
                <div><strong>${item.nome}</strong></div>
                <small>Qnt: ${item.quantidade} × ${formatarMoeda(item.preco)}</small>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <strong>${formatarMoeda(subtotal)}</strong>
                <div class="quantidade-control">
                    <button onclick="mudarQuantidade('${item.id}', -1)">−</button>
                    <button onclick="mudarQuantidade('${item.id}', 1)">+</button>
                </div>
                <button class="btn btn-danger btn-icon" onclick="removerDoCarrinho('${item.id}')">
                    <svg class="icon"><use href="#icon-delete"></use></svg>
                </button>
            </div>
        `
    container.appendChild(itemDiv)
  })

  const descontoPercentual = Number.parseFloat(document.getElementById("desconto").value) || 0
  const descontoValor = (total * descontoPercentual) / 100
  descontoAtual = descontoValor
  const totalComDesconto = total - descontoValor

  document.getElementById("carrinhoTotal").textContent = formatarMoeda(totalComDesconto)
  document.getElementById("descontoValor").textContent = descontoValor.toFixed(2)
}

function mudarQuantidade(produtoId, delta) {
  const item = carrinho.find((i) => i.id === produtoId)
  if (item) {
    item.quantidade += delta
    if (item.quantidade <= 0) {
      removerDoCarrinho(produtoId)
    } else {
      atualizarCarrinho()
    }
  }
}

function removerDoCarrinho(produtoId) {
  carrinho = carrinho.filter((item) => item.id !== produtoId)
  atualizarCarrinho()
}

function limparCarrinho() {
  if (confirm("Limpar o carrinho?")) {
    carrinho = []
    clienteVendaAtual = null
    document.getElementById("desconto").value = "0"
    document.getElementById("clienteVenda").value = ""
    document.getElementById("clienteSelecionado").style.display = "none"
    atualizarCarrinho()
  }
}

function atualizarDesconto() {
  atualizarCarrinho()
}

function mostrarPagamentoDinheiro() {
  const metodo = document.getElementById("metodoPagamento").value
  const pagamentoDinheiro = document.getElementById("pagamentoDinheiro")

  if (metodo === "dinheiro") {
    pagamentoDinheiro.classList.add("active")
  } else {
    pagamentoDinheiro.classList.remove("active")
  }
}

function calcularTroco() {
  const totalElement = document.getElementById("carrinhoTotal").textContent
  const total = Number.parseFloat(totalElement.replace(/[^0-9,]/g, "").replace(",", "."))
  const valorRecebido = Number.parseFloat(document.getElementById("valorRecebido").value) || 0
  const troco = valorRecebido - total

  document.getElementById("valorTroco").value = troco.toFixed(2)
}

function finalizarVenda() {
  if (carrinho.length === 0) {
    alert("Carrinho vazio!")
    return
  }

  if (!caixaAtual) {
    alert("Abra o caixa antes de finalizar a venda!")
    return
  }

  // Verificar se cliente foi selecionado
  if (!clienteVendaAtual) {
    const confirmar = confirm("⚠️ Nenhum cliente selecionado!\n\nDeseja continuar mesmo assim?")
    if (!confirmar) {
      return
    }
  }

  const totalElement = document.getElementById("carrinhoTotal").textContent
  const total = Number.parseFloat(totalElement.replace(/[^0-9,]/g, "").replace(",", "."))

  const venda = {
    id: Date.now().toString(),
    data: new Date().toISOString(),
    itens: [...carrinho],
    total: total,
    desconto: descontoAtual,
    metodo: document.getElementById("metodoPagamento").value,
    caixa: caixaAtual,
    cliente: clienteVendaAtual
      ? {
          id: clienteVendaAtual.id,
          nome: clienteVendaAtual.nome,
          telefone: clienteVendaAtual.telefone,
        }
      : null,
  }

  vendas.push(venda)
  localStorage.setItem("vendas", JSON.stringify(vendas))

  // Atualizar estoque
  carrinho.forEach((item) => {
    const produto = produtos.find((p) => p.id === item.id)
    if (produto) {
      produto.estoque -= item.quantidade
    }
  })
  localStorage.setItem("produtos", JSON.stringify(produtos))

  // Mostrar comprovante
  mostrarComprovante(venda)

  // Limpar carrinho e cliente
  carrinho = []
  clienteVendaAtual = null
  document.getElementById("desconto").value = "0"
  document.getElementById("clienteVenda").value = ""
  document.getElementById("clienteSelecionado").style.display = "none"
  atualizarCarrinho()
}

function mostrarComprovante(venda) {
  let conteudo = `
        <div class="comprovante-header">
            <h3>LaBella Woman</h3>
            <p>Comprovante de Venda</p>
            <small>${formatarData(venda.data)}</small>
        </div>
    `

  // Adicionar cliente se existir
  if (venda.cliente) {
    conteudo += `
        <div style="margin-bottom: 1rem; padding: 0.5rem; background: #f0f0f0; border-radius: 4px;">
            <strong>Cliente:</strong> ${venda.cliente.nome}<br>
            <small>Tel: ${venda.cliente.telefone || "N/A"}</small>
        </div>
    `
  }

  conteudo += '<div style="margin-bottom: 1rem;">'

  venda.itens.forEach((item) => {
    const subtotal = item.preco * item.quantidade
    conteudo += `
            <div class="comprovante-item">
                <span>${item.nome}</span>
                <span>${formatarMoeda(subtotal)}</span>
            </div>
            <small style="margin-left: 10px;">${item.quantidade}x ${formatarMoeda(item.preco)}</small><br>
        `
  })

  conteudo += `
        </div>
        <div class="comprovante-footer">
            <div class="comprovante-item" style="font-weight: bold;">
                <span>TOTAL:</span>
                <span>${formatarMoeda(venda.total)}</span>
            </div>
            <small>Método: ${venda.metodo.toUpperCase()}</small>
            <p style="margin-top: 1rem; font-size: 0.8rem;">Obrigado pela compra!</p>
        </div>
    `

  document.getElementById("comprovanteConteudo").innerHTML = conteudo
  document.getElementById("modalComprovante").classList.add("active")
}

function imprimirComprovante() {
  window.print()
}

// Produtos Functions
async function carregarProdutos() {
  mostrarProdutosDisponíveis()
  mostrarTabelaProdutos()
}

function mostrarTabelaProdutos() {
  const tbody = document.getElementById("produtosTabela")
  tbody.innerHTML = ""

  produtos.forEach((produto) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${produto.codigo}</td>
            <td>${produto.nome}</td>
            <td>${produto.categoria}</td>
            <td>${produto.tamanhos || "—"}</td>
            <td>${produto.precoCusto ? formatarMoeda(produto.precoCusto) : "—"}</td>
            <td>${formatarMoeda(produto.preco)}</td>
            <td style="color: ${produto.estoque > 10 ? "#2ecc71" : "#f39c12"}; font-weight: bold;">${produto.estoque}</td>
            <td>
                <button class="btn btn-warning btn-icon" onclick="editarProduto('${produto.id}')">
                    <svg class="icon"><use href="#icon-edit"></use></svg>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deletarProduto('${produto.id}')">
                    <svg class="icon"><use href="#icon-delete"></use></svg>
                </button>
            </td>
        `
    tbody.appendChild(tr)
  })
}

function filtrarProdutos() {
  const searchTerm = document.getElementById("searchProdutoGerenciamento").value.toLowerCase()
  const tbody = document.getElementById("produtosTabela")
  const rows = tbody.getElementsByTagName("tr")

  Array.from(rows).forEach((row) => {
    const text = row.textContent.toLowerCase()
    row.style.display = text.includes(searchTerm) ? "" : "none"
  })
}

function abrirModalProduto() {
  document.getElementById("produtoCodigo").value = ""
  document.getElementById("produtoNome").value = ""
  document.getElementById("produtoCategoria").value = ""
  document.getElementById("produtoTamanhos").value = ""
  document.getElementById("produtoPrecoCusto").value = ""
  document.getElementById("produtoPreco").value = ""
  document.getElementById("produtoEstoque").value = ""
  document.getElementById("modalProduto").classList.add("active")
}

function salvarProduto(event) {
  event.preventDefault()

  const novoProduto = {
    id: Date.now().toString(),
    codigo: document.getElementById("produtoCodigo").value,
    nome: document.getElementById("produtoNome").value,
    categoria: document.getElementById("produtoCategoria").value,
    tamanhos: document.getElementById("produtoTamanhos").value,
    precoCusto: Number.parseFloat(document.getElementById("produtoPrecoCusto").value),
    preco: Number.parseFloat(document.getElementById("produtoPreco").value),
    estoque: Number.parseInt(document.getElementById("produtoEstoque").value),
  }

  produtos.push(novoProduto)
  localStorage.setItem("produtos", JSON.stringify(produtos))

  fecharModal("modalProduto")
  carregarProdutos()
}

function editarProduto(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId)
  if (!produto) return

  document.getElementById("produtoCodigo").value = produto.codigo
  document.getElementById("produtoNome").value = produto.nome
  document.getElementById("produtoCategoria").value = produto.categoria
  document.getElementById("produtoTamanhos").value = produto.tamanhos || ""
  document.getElementById("produtoPrecoCusto").value = produto.precoCusto || 0
  document.getElementById("produtoPreco").value = produto.preco
  document.getElementById("produtoEstoque").value = produto.estoque

  document.getElementById("modalProduto").classList.add("active")
}

function deletarProduto(produtoId) {
  if (confirm("Deletar este produto?")) {
    produtos = produtos.filter((p) => p.id !== produtoId)
    localStorage.setItem("produtos", JSON.stringify(produtos))
    carregarProdutos()
  }
}

// Clientes Functions
async function carregarClientes() {
  mostrarTabelaClientes()
}

function mostrarTabelaClientes() {
  const tbody = document.getElementById("clientesTabela")

  if (clientes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">Nenhum cliente cadastrado</td></tr>'
    return
  }

  tbody.innerHTML = ""

  clientes.forEach((cliente) => {
    const tr = document.createElement("tr")
    tr.style.cursor = "pointer"
    tr.onclick = () => visualizarCliente(cliente.id)

    tr.innerHTML = `
      <td>
        <strong>${cliente.nome}</strong>
        ${cliente.cpf ? `<br><small style="color: #666;">CPF: ${cliente.cpf}</small>` : ""}
      </td>
      <td>${cliente.telefone || "—"}</td>
      <td>${cliente.email ? `<a href="mailto:${cliente.email}" style="color: #00BFFF; text-decoration: none;">${cliente.email}</a>` : "—"}</td>
      <td>${cliente.cidade ? cliente.cidade + " / " + (cliente.estado || "") : "—"}</td>
      <td>${formatarData(cliente.dataCadastro)}</td>
      <td>
        <button class="btn btn-primary btn-icon" onclick="event.stopPropagation(); visualizarCliente('${cliente.id}')" title="Visualizar">
          <svg class="icon"><use href="#icon-eye"></use></svg>
        </button>
        <button class="btn btn-danger btn-icon" onclick="event.stopPropagation(); if(confirm('Deletar cliente?')) deletarCliente('${cliente.id}')" title="Deletar">
          <svg class="icon"><use href="#icon-delete"></use></svg>
        </button>
      </td>
    `
    tbody.appendChild(tr)
  })
}

function filtrarClientes() {
  const searchTerm = document.getElementById("searchCliente").value.toLowerCase()
  const tbody = document.getElementById("clientesTabela")
  const rows = tbody.getElementsByTagName("tr")

  Array.from(rows).forEach((row) => {
    const text = row.textContent.toLowerCase()
    row.style.display = text.includes(searchTerm) ? "" : "none"
  })
}

function abrirModalCliente() {
  clienteEmEdicao = null
  document.getElementById("clienteNome").value = ""
  document.getElementById("clienteCPF").value = ""
  document.getElementById("clienteDataNascimento").value = ""
  document.getElementById("clienteTelefone").value = ""
  document.getElementById("clienteEmail").value = ""
  document.getElementById("clienteEndereco").value = ""
  document.getElementById("clienteNumero").value = ""
  document.getElementById("clienteComplemento").value = ""
  document.getElementById("clienteBairro").value = ""
  document.getElementById("clienteCidade").value = ""
  document.getElementById("clienteEstado").value = ""
  document.getElementById("clienteCEP").value = ""
  document.getElementById("clienteObservacoes").value = ""
  document.querySelector("#modalCliente .modal-header .card-title").textContent = "Novo Cliente"
  document.getElementById("modalCliente").classList.add("active")
}

function salvarCliente(event) {
  event.preventDefault()

  // Validações
  const nome = document.getElementById("clienteNome").value.trim()
  const cpf = document.getElementById("clienteCPF").value
  const telefone = document.getElementById("clienteTelefone").value
  const email = document.getElementById("clienteEmail").value

  if (!nome) {
    alert("⚠️ Nome é obrigatório!")
    return
  }

  if (cpf && !validarCPF(cpf)) {
    alert("⚠️ CPF inválido!")
    return
  }

  if (!telefone) {
    alert("⚠️ Telefone é obrigatório!")
    return
  }

  if (email && !email.includes("@")) {
    alert("⚠️ Email inválido!")
    return
  }

  const novoCliente = {
    id: clienteEmEdicao ? clienteEmEdicao.id : Date.now().toString(),
    nome: nome,
    cpf: cpf || null,
    dataNascimento: document.getElementById("clienteDataNascimento").value || null,
    telefone: telefone,
    email: email || null,
    endereco: document.getElementById("clienteEndereco").value || null,
    numero: document.getElementById("clienteNumero").value || null,
    complemento: document.getElementById("clienteComplemento").value || null,
    bairro: document.getElementById("clienteBairro").value || null,
    cidade: document.getElementById("clienteCidade").value || null,
    estado: document.getElementById("clienteEstado").value || null,
    cep: document.getElementById("clienteCEP").value || null,
    observacoes: document.getElementById("clienteObservacoes").value || null,
    dataCadastro: clienteEmEdicao ? clienteEmEdicao.dataCadastro : new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
  }

  if (clienteEmEdicao) {
    // Editar cliente existente
    const index = clientes.findIndex((c) => c.id === clienteEmEdicao.id)
    if (index !== -1) {
      clientes[index] = novoCliente
    }
  } else {
    // Novo cliente
    clientes.push(novoCliente)
  }

  localStorage.setItem("clientes", JSON.stringify(clientes))

  fecharModal("modalCliente")
  carregarClientes()
  carregarClientesNoSelect()

  alert("✅ Cliente " + (clienteEmEdicao ? "atualizado" : "cadastrado") + " com sucesso!")
}

function visualizarCliente(clienteId) {
  const cliente = clientes.find((c) => c.id === clienteId)
  if (!cliente) return

  clienteEmEdicao = cliente

  let conteudo = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
      <div class="cliente-field">
        <div class="cliente-field-label">👤 Nome</div>
        <div class="cliente-field-value">${cliente.nome}</div>
      </div>
  `

  if (cliente.cpf) {
    conteudo += `
      <div class="cliente-field">
        <div class="cliente-field-label">🔐 CPF</div>
        <div class="cliente-field-value">${cliente.cpf}</div>
      </div>
    `
  }

  if (cliente.dataNascimento) {
    conteudo += `
      <div class="cliente-field">
        <div class="cliente-field-label">🎂 Data Nascimento</div>
        <div class="cliente-field-value">${new Date(cliente.dataNascimento).toLocaleDateString("pt-BR")}</div>
      </div>
    `
  }

  conteudo += `
    <div class="cliente-field">
      <div class="cliente-field-label">📱 Telefone</div>
      <div class="cliente-field-value">${cliente.telefone}</div>
    </div>
  `

  if (cliente.email) {
    conteudo += `
      <div class="cliente-field">
        <div class="cliente-field-label">✉️ Email</div>
        <div class="cliente-field-value">${cliente.email}</div>
      </div>
    `
  }

  conteudo += `</div>`

  if (cliente.endereco || cliente.cidade || cliente.estado) {
    conteudo += `
      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid rgba(0, 191, 255, 0.2);">
        <h3 style="color: #00BFFF; font-size: 0.9rem; margin-bottom: 1rem; text-transform: uppercase;">Endereço</h3>
        <div class="cliente-field">
          <div class="cliente-field-value">
            ${cliente.endereco || "—"} ${cliente.numero ? ", " + cliente.numero : ""} ${cliente.complemento ? "- " + cliente.complemento : ""}<br>
            ${cliente.bairro || "—"} - ${cliente.cidade || "—"} / ${cliente.estado || "—"}<br>
            ${cliente.cep ? "CEP: " + cliente.cep : ""}
          </div>
        </div>
      </div>
    `
  }

  if (cliente.observacoes) {
    conteudo += `
      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid rgba(0, 191, 255, 0.2);">
        <h3 style="color: #00BFFF; font-size: 0.9rem; margin-bottom: 1rem; text-transform: uppercase;">Notas</h3>
        <div class="cliente-field">
          <div class="cliente-field-value">${cliente.observacoes}</div>
        </div>
      </div>
    `
  }

  conteudo += `
    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid rgba(0, 191, 255, 0.2); display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #666;">
      <span>Cadastrado: ${formatarData(cliente.dataCadastro)}</span>
      <span>Atualizado: ${formatarData(cliente.dataAtualizacao || cliente.dataCadastro)}</span>
    </div>
  `

  document.getElementById("clienteDetalhes").innerHTML = conteudo
  document.getElementById("modalVisualizarCliente").classList.add("active")
}

function abrirEdicaoCliente() {
  if (!clienteEmEdicao) return

  fecharModal("modalVisualizarCliente")

  document.getElementById("clienteNome").value = clienteEmEdicao.nome
  document.getElementById("clienteCPF").value = clienteEmEdicao.cpf || ""
  document.getElementById("clienteDataNascimento").value = clienteEmEdicao.dataNascimento || ""
  document.getElementById("clienteTelefone").value = clienteEmEdicao.telefone
  document.getElementById("clienteEmail").value = clienteEmEdicao.email || ""
  document.getElementById("clienteEndereco").value = clienteEmEdicao.endereco || ""
  document.getElementById("clienteNumero").value = clienteEmEdicao.numero || ""
  document.getElementById("clienteComplemento").value = clienteEmEdicao.complemento || ""
  document.getElementById("clienteBairro").value = clienteEmEdicao.bairro || ""
  document.getElementById("clienteCidade").value = clienteEmEdicao.cidade || ""
  document.getElementById("clienteEstado").value = clienteEmEdicao.estado || ""
  document.getElementById("clienteCEP").value = clienteEmEdicao.cep || ""
  document.getElementById("clienteObservacoes").value = clienteEmEdicao.observacoes || ""

  document.querySelector("#modalCliente .modal-header .card-title").textContent = "Editar Cliente"
  document.getElementById("modalCliente").classList.add("active")
}

function deletarClienteAtual() {
  if (!clienteEmEdicao) return

  if (confirm(`Tem certeza que deseja deletar ${clienteEmEdicao.nome}?`)) {
    deletarCliente(clienteEmEdicao.id)
    fecharModal("modalVisualizarCliente")
  }
}

function carregarClientesNoSelect() {
  const select = document.getElementById("clienteVenda")
  if (!select) return

  select.innerHTML = '<option value="">Selecione um cliente...</option>'

  clientes.forEach((cliente) => {
    const option = document.createElement("option")
    option.value = cliente.id
    option.textContent = `${cliente.nome} - ${cliente.telefone || "Sem telefone"}`
    select.appendChild(option)
  })
}

function selecionarCliente() {
  const select = document.getElementById("clienteVenda")
  const clienteId = select.value

  if (!clienteId) {
    clienteVendaAtual = null
    document.getElementById("clienteSelecionado").style.display = "none"
    return
  }

  const cliente = clientes.find((c) => c.id === clienteId)
  if (cliente) {
    clienteVendaAtual = cliente
    document.getElementById("clienteNomeSelecionado").textContent = cliente.nome
    document.getElementById("clienteTelefoneSelecionado").textContent = cliente.telefone || "Sem telefone"
    document.getElementById("clienteSelecionado").style.display = "block"
  }
}

function abrirCadastroRapidoCliente() {
  document.getElementById("clienteRapidoNome").value = ""
  document.getElementById("clienteRapidoTelefone").value = ""
  document.getElementById("clienteRapidoEmail").value = ""
  document.getElementById("modalClienteRapido").classList.add("active")
}

function salvarClienteRapido(event) {
  event.preventDefault()

  const novoCliente = {
    id: Date.now().toString(),
    nome: document.getElementById("clienteRapidoNome").value,
    telefone: document.getElementById("clienteRapidoTelefone").value,
    email: document.getElementById("clienteRapidoEmail").value || "",
    dataCadastro: new Date().toISOString(),
  }

  clientes.push(novoCliente)
  localStorage.setItem("clientes", JSON.stringify(clientes))

  // Recarregar select
  carregarClientesNoSelect()

  // Selecionar automaticamente o cliente cadastrado
  document.getElementById("clienteVenda").value = novoCliente.id
  selecionarCliente()

  // Fechar modal
  fecharModal("modalClienteRapido")

  // Mostrar mensagem de sucesso
  alert("✅ Cliente cadastrado e selecionado com sucesso!")
}

function deletarCliente(clienteId) {
  clientes = clientes.filter((c) => c.id !== clienteId)
  localStorage.setItem("clientes", JSON.stringify(clientes))
}

// Caixa Functions
async function verificarCaixaAberto() {
  const caixaAberto = caixas.find((c) => !c.dataFechamento)

  if (caixaAberto) {
    caixaAtual = caixaAberto.id
    document.getElementById("caixaStatus").textContent = "Caixa Aberto"
    document.getElementById("caixaStatus").className = "caixa-status caixa-aberto"
    document.getElementById("btnAbrirCaixa").style.display = "none"
    document.getElementById("btnFecharCaixa").style.display = "inline-flex"
  } else {
    caixaAtual = null
    document.getElementById("caixaStatus").textContent = "Caixa Fechado"
    document.getElementById("caixaStatus").className = "caixa-status caixa-fechado"
    document.getElementById("btnAbrirCaixa").style.display = "inline-flex"
    document.getElementById("btnFecharCaixa").style.display = "none"
  }
}

function abrirCaixa() {
  const novoCaixa = {
    id: Date.now().toString(),
    dataAbertura: new Date().toISOString(),
    dataFechamento: null,
    saldoInicial: 0,
    saldoFinal: 0,
  }

  caixas.push(novoCaixa)
  localStorage.setItem("caixas", JSON.stringify(caixas))

  verificarCaixaAberto()
}

function fecharCaixa() {
  if (!caixaAtual) return

  const caixa = caixas.find((c) => c.id === caixaAtual)
  if (caixa) {
    caixa.dataFechamento = new Date().toISOString()
    localStorage.setItem("caixas", JSON.stringify(caixas))
  }

  verificarCaixaAberto()
  carregarHistoricoCaixas()
}

async function carregarHistoricoCaixas() {
  const container = document.getElementById("historicoCaixas")
  container.innerHTML = ""

  if (caixas.length === 0) {
    container.innerHTML = '<p style="color: #b0b0b0; text-align: center; padding: 2rem;">Nenhum registro de caixa</p>'
    return
  }

  const tabela = document.createElement("div")
  tabela.className = "table-container"
  tabela.innerHTML =
    "<table><thead><tr><th>Data Abertura</th><th>Data Fechamento</th><th>Status</th></tr></thead><tbody>"

  caixas.forEach((caixa) => {
    const status = caixa.dataFechamento ? "Fechado" : "Aberto"
    const statusColor = caixa.dataFechamento ? "#e74c3c" : "#2ecc71"

    tabela.innerHTML += `
            <tr>
                <td>${formatarData(caixa.dataAbertura)}</td>
                <td>${caixa.dataFechamento ? formatarData(caixa.dataFechamento) : "—"}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
            </tr>
        `
  })

  tabela.innerHTML += "</tbody></table>"
  container.appendChild(tabela)
}

// Movimentações Functions
async function carregarMovimentacoes() {
  mostrarTabelaMovimentacoes()
}

function mostrarTabelaMovimentacoes() {
  const container = document.getElementById("tabelaMovimentacoes")
  container.innerHTML = ""

  if (movimentacoes.length === 0) {
    container.innerHTML =
      '<p style="color: #b0b0b0; text-align: center; padding: 2rem;">Nenhuma movimentação registrada</p>'
    return
  }

  const tabela = document.createElement("div")
  tabela.className = "table-container"
  tabela.innerHTML = "<table><thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Descrição</th></tr></thead><tbody>"

  movimentacoes.forEach((mov) => {
    const cor = mov.tipo === "entrada" ? "#2ecc71" : "#e74c3c"
    const simbolo = mov.tipo === "entrada" ? "+" : "−"

    tabela.innerHTML += `
            <tr>
                <td>${formatarData(mov.data)}</td>
                <td style="text-transform: capitalize;">${mov.tipo}</td>
                <td style="color: ${cor}; font-weight: bold;">${simbolo} ${formatarMoeda(mov.valor)}</td>
                <td>${mov.descricao}</td>
            </tr>
        `
  })

  tabela.innerHTML += "</tbody></table>"
  container.appendChild(tabela)
}

function abrirModalMovimentacao() {
  document.getElementById("movimentacaoTipo").value = ""
  document.getElementById("movimentacaoValor").value = ""
  document.getElementById("movimentacaoDescricao").value = ""
  document.getElementById("modalMovimentacao").classList.add("active")
}

function salvarMovimentacao(event) {
  event.preventDefault()

  const novaMovimentacao = {
    id: Date.now().toString(),
    tipo: document.getElementById("movimentacaoTipo").value,
    valor: Number.parseFloat(document.getElementById("movimentacaoValor").value),
    descricao: document.getElementById("movimentacaoDescricao").value,
    data: new Date().toISOString(),
  }

  movimentacoes.push(novaMovimentacao)
  localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes))

  fecharModal("modalMovimentacao")
  carregarMovimentacoes()
}

// Relatórios Functions
async function carregarRelatorios() {
  filtrarRelatorio("hoje")
}

function filtrarRelatorio(filtro) {
  filtroRelatorioAtual = filtro

  document.querySelectorAll(".filtro-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  event.target.classList.add("active")

  const agora = new Date()
  let dataInicio = new Date()

  switch (filtro) {
    case "hoje":
      dataInicio.setHours(0, 0, 0, 0)
      break
    case "semana":
      dataInicio.setDate(agora.getDate() - 7)
      break
    case "mes":
      dataInicio.setDate(1)
      break
    case "todos":
      dataInicio = new Date(0)
      break
  }

  const vendasFiltradas = vendas.filter((v) => new Date(v.data) >= dataInicio)

  // Stats
  const totalVendas = vendasFiltradas.reduce((sum, v) => sum + v.total, 0)
  const quantidade = vendasFiltradas.reduce((sum, v) => sum + v.itens.reduce((s, i) => s + i.quantidade, 0), 0)
  const ticket = vendasFiltradas.length > 0 ? totalVendas / vendasFiltradas.length : 0

  const statsGrid = document.getElementById("statsGrid")
  statsGrid.innerHTML = `
        <div class="stat-card">
            <svg class="icon-lg" style="color: #d4af37;"><use href="#icon-cash"></use></svg>
            <div class="stat-value">${formatarMoeda(totalVendas)}</div>
            <div class="stat-label">Total em Vendas</div>
        </div>
        <div class="stat-card">
            <svg class="icon-lg" style="color: #2ecc71;"><use href="#icon-box"></use></svg>
            <div class="stat-value">${quantidade}</div>
            <div class="stat-label">Itens Vendidos</div>
        </div>
        <div class="stat-card">
            <svg class="icon-lg" style="color: #3498db;"><use href="#icon-cart"></use></svg>
            <div class="stat-value">${vendasFiltradas.length}</div>
            <div class="stat-label">Transações</div>
        </div>
        <div class="stat-card">
            <svg class="icon-lg" style="color: #f39c12;"><use href="#icon-money-transfer"></use></svg>
            <div class="stat-value">${formatarMoeda(ticket)}</div>
            <div class="stat-label">Ticket Médio</div>
        </div>
    `

  // Tabela
  const container = document.getElementById("tabelaRelatorios")
  container.innerHTML = ""

  if (vendasFiltradas.length === 0) {
    container.innerHTML =
      '<p style="color: #b0b0b0; text-align: center; padding: 2rem;">Nenhuma venda neste período</p>'
    return
  }

  const tabela = document.createElement("div")
  tabela.className = "table-container"
  tabela.innerHTML =
    "<table><thead><tr><th>Data</th><th>Cliente</th><th>Produtos</th><th>Qtd</th><th>Total</th><th>Método</th></tr></thead><tbody>"

  vendasFiltradas.forEach((venda) => {
    const produtos = venda.itens.map((i) => i.nome).join(", ")
    const qty = venda.itens.reduce((sum, i) => sum + i.quantidade, 0)
    const clienteNome = venda.cliente ? venda.cliente.nome : "Não informado"

    tabela.innerHTML += `
            <tr>
                <td>${formatarData(venda.data)}</td>
                <td>${clienteNome}</td>
                <td>${produtos}</td>
                <td>${qty}</td>
                <td style="color: #2ecc71; font-weight: bold;">${formatarMoeda(venda.total)}</td>
                <td style="text-transform: capitalize;">${venda.metodo}</td>
            </tr>
        `
  })

  tabela.innerHTML += "</tbody></table>"
  container.appendChild(tabela)
}

// Modal Functions
function fecharModal(modalId) {
  document.getElementById(modalId).classList.remove("active")
}

// Logout
function logout() {
  if (confirm("Sair do sistema?")) {
    caixaAtual = null
    carrinho = []
    localStorage.clear()
    location.reload()
  }
}

// Busca de produtos no PDV
document.addEventListener("DOMContentLoaded", () => {
  const searchProduto = document.getElementById("searchProduto")
  if (searchProduto) {
    searchProduto.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase()
      const container = document.getElementById("produtosList")
      const items = container.getElementsByClassName("produto-item")

      Array.from(items).forEach((item) => {
        const text = item.textContent.toLowerCase()
        item.style.display = text.includes(searchTerm) ? "" : "none"
      })
    })
  }
})

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "")

  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let soma = 0
  let resto

  for (let i = 1; i <= 9; i++) {
    soma += Number.parseInt(cpf.substring(i - 1, i)) * (11 - i)
  }

  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== Number.parseInt(cpf.substring(9, 10))) return false

  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma += Number.parseInt(cpf.substring(i - 1, i)) * (12 - i)
  }

  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== Number.parseInt(cpf.substring(10, 11))) return false

  return true
}

// Evento de entrada para formatação automática de CPF e CEP
document.addEventListener("DOMContentLoaded", () => {
  const cpfInput = document.getElementById("clienteCPF")
  if (cpfInput) {
    cpfInput.addEventListener("input", (e) => {
      e.target.value = formatarCPF(e.target.value)
    })
  }

  const cepInput = document.getElementById("clienteCEP")
  if (cepInput) {
    cepInput.addEventListener("input", (e) => {
      e.target.value = formatarCEP(e.target.value)
    })
  }
})
