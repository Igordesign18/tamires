// Formatar CPF
function formatarCPF(valor) {
  let cpf = valor.replace(/\D/g, "")
  if (cpf.length > 11) cpf = cpf.slice(0, 11)
  if (cpf.length <= 3) return cpf
  if (cpf.length <= 6) return cpf.slice(0, 3) + "." + cpf.slice(3)
  if (cpf.length <= 9) return cpf.slice(0, 3) + "." + cpf.slice(3, 6) + "." + cpf.slice(6)
  return cpf.slice(0, 3) + "." + cpf.slice(3, 6) + "." + cpf.slice(6, 9) + "-" + cpf.slice(9)
}

// Validar CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "")
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

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

// Formatar CEP
function formatarCEP(valor) {
  let cep = valor.replace(/\D/g, "")
  if (cep.length > 8) cep = cep.slice(0, 8)
  if (cep.length <= 5) return cep
  return cep.slice(0, 5) + "-" + cep.slice(5)
}

// Adicionar formatação automática aos inputs
function adicionarFormatacoes() {
  // Formatação CPF
  const cpfInput = document.getElementById("clienteCPF")
  if (cpfInput) {
    cpfInput.addEventListener("input", (e) => {
      e.target.value = formatarCPF(e.target.value)
    })
  }

  // Formatação CEP
  const cepInput = document.getElementById("clienteCEP")
  if (cepInput) {
    cepInput.addEventListener("input", (e) => {
      e.target.value = formatarCEP(e.target.value)
    })
  }

  // Formatação Telefone
  adicionarFormatacaoTelefone()
}

let clientes = [] // Declare clientes variable

document.addEventListener("DOMContentLoaded", () => {
  const searchCliente = document.getElementById("searchCliente")
  if (searchCliente) {
    searchCliente.addEventListener("input", filtrarClientes)
  }

  const clientesArmazenados = localStorage.getItem("clientes")
  if (clientesArmazenados) {
    try {
      clientes = JSON.parse(clientesArmazenados)
    } catch (e) {
      console.error("Erro ao carregar clientes:", e)
      clientes = []
    }
  }
  carregarClientes()
  carregarClientesNoSelect()

  adicionarFormatacoes()
})

async function carregarClientes() {
  mostrarTabelaClientes()
}

function mostrarTabelaClientes() {
  const tbody = document.getElementById("clientesTabela")
  tbody.innerHTML = ""

  if (clientes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: #b0b0b0; padding: 2rem;">Nenhum cliente cadastrado</td></tr>'
    return
  }

  clientes.forEach((cliente) => {
    const tr = document.createElement("tr")
    tr.style.cursor = "pointer"
    tr.onclick = () => visualizarCliente(cliente.id)
    tr.innerHTML = `
      <td><strong>${cliente.nome}</strong></td>
      <td>${cliente.cpf || "—"}</td>
      <td>${cliente.telefone || "—"}</td>
      <td>${cliente.email || "—"}</td>
      <td>${cliente.cidade || "—"}</td>
      <td>${formatarData(cliente.dataCadastro)}</td>
      <td onclick="event.stopPropagation()">
        <button class="btn btn-primary btn-icon" onclick="abrirEdicaoCliente('${cliente.id}')" title="Editar">
          <svg class="icon"><use href="#icon-edit"></use></svg>
        </button>
        <button class="btn btn-danger btn-icon" onclick="deletarCliente('${cliente.id}')" title="Deletar">
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

// Variável para armazenar cliente em edição
let clienteEmEdicao = null

function abrirModalCliente() {
  clienteEmEdicao = null
  document.getElementById("modalClienteTitulo").textContent = "Cadastro de Cliente"
  limparFormularioCliente()
  document.getElementById("modalCliente").classList.add("active")
  adicionarFormatacoes()
}

function abrirEdicaoCliente(clienteId) {
  const cliente = clientes.find((c) => c.id === clienteId)
  if (!cliente) return

  clienteEmEdicao = cliente.id
  document.getElementById("modalClienteTitulo").textContent = "Editar Cliente"

  document.getElementById("clienteNome").value = cliente.nome
  document.getElementById("clienteCPF").value = cliente.cpf || ""
  document.getElementById("clienteDataNascimento").value = cliente.dataNascimento || ""
  document.getElementById("clienteTelefone").value = cliente.telefone || ""
  document.getElementById("clienteEmail").value = cliente.email || ""
  document.getElementById("clienteEndereco").value = cliente.endereco || ""
  document.getElementById("clienteNumero").value = cliente.numero || ""
  document.getElementById("clienteComplemento").value = cliente.complemento || ""
  document.getElementById("clienteBairro").value = cliente.bairro || ""
  document.getElementById("clienteCidade").value = cliente.cidade || ""
  document.getElementById("clienteEstado").value = cliente.estado || ""
  document.getElementById("clienteCEP").value = cliente.cep || ""
  document.getElementById("clienteObservacoes").value = cliente.observacoes || ""

  document.getElementById("modalCliente").classList.add("active")
  adicionarFormatacoes()
  fecharModal("modalVisualizarCliente")
}

function limparFormularioCliente() {
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
}

function salvarCliente(event) {
  event.preventDefault()

  const nome = document.getElementById("clienteNome").value.trim()
  const cpf = document.getElementById("clienteCPF").value.trim()
  const telefone = document.getElementById("clienteTelefone").value.trim()
  const email = document.getElementById("clienteEmail").value.trim()

  // Validações
  if (!nome) {
    alert("Por favor, preencha o nome completo!")
    return
  }

  if (cpf && !validarCPF(cpf)) {
    alert("CPF inválido! Verifique o número digitado.")
    return
  }

  if (email && !email.includes("@")) {
    alert("Email inválido!")
    return
  }

  if (!telefone) {
    alert("Por favor, preencha o telefone!")
    return
  }

  // Verificar CPF duplicado (se não estiver editando o mesmo cliente)
  const cpfDuplicado = clientes.find((c) => c.cpf === cpf && (!clienteEmEdicao || c.id !== clienteEmEdicao))
  if (cpfDuplicado) {
    alert("Este CPF já está cadastrado!")
    return
  }

  if (clienteEmEdicao) {
    // Editar cliente existente
    const cliente = clientes.find((c) => c.id === clienteEmEdicao)
    if (cliente) {
      cliente.nome = nome
      cliente.cpf = cpf
      cliente.dataNascimento = document.getElementById("clienteDataNascimento").value
      cliente.telefone = telefone
      cliente.email = email
      cliente.endereco = document.getElementById("clienteEndereco").value
      cliente.numero = document.getElementById("clienteNumero").value
      cliente.complemento = document.getElementById("clienteComplemento").value
      cliente.bairro = document.getElementById("clienteBairro").value
      cliente.cidade = document.getElementById("clienteCidade").value
      cliente.estado = document.getElementById("clienteEstado").value
      cliente.cep = document.getElementById("clienteCEP").value
      cliente.observacoes = document.getElementById("clienteObservacoes").value
      cliente.dataAtualizacao = new Date().toISOString()
    }
    alert("✅ Cliente atualizado com sucesso!")
  } else {
    // Criar novo cliente
    const novoCliente = {
      id: Date.now().toString(),
      nome: nome,
      cpf: cpf,
      dataNascimento: document.getElementById("clienteDataNascimento").value,
      telefone: telefone,
      email: email,
      endereco: document.getElementById("clienteEndereco").value,
      numero: document.getElementById("clienteNumero").value,
      complemento: document.getElementById("clienteComplemento").value,
      bairro: document.getElementById("clienteBairro").value,
      cidade: document.getElementById("clienteCidade").value,
      estado: document.getElementById("clienteEstado").value,
      cep: document.getElementById("clienteCEP").value,
      observacoes: document.getElementById("clienteObservacoes").value,
      dataCadastro: new Date().toISOString(),
    }
    clientes.push(novoCliente)
    alert("✅ Cliente cadastrado com sucesso!")
  }

  localStorage.setItem("clientes", JSON.stringify(clientes))
  fecharModal("modalCliente")
  carregarClientes()
  carregarClientesNoSelect()
  clienteEmEdicao = null
}

function visualizarCliente(clienteId) {
  const cliente = clientes.find((c) => c.id === clienteId)
  if (!cliente) return

  let enderecoCompleto = ""
  if (cliente.endereco) {
    enderecoCompleto = cliente.endereco
    if (cliente.numero) enderecoCompleto += ", " + cliente.numero
    if (cliente.complemento) enderecoCompleto += " - " + cliente.complemento
    if (cliente.bairro) enderecoCompleto += ", " + cliente.bairro
    if (cliente.cidade) enderecoCompleto += ", " + cliente.cidade
    if (cliente.estado) enderecoCompleto += " - " + cliente.estado
    if (cliente.cep) enderecoCompleto += ", " + cliente.cep
  }

  const detalhesHTML = `
    <div class="detalhe-row">
      <div class="detalhe-item">
        <div class="detalhe-label">Nome</div>
        <div class="detalhe-valor">${cliente.nome}</div>
      </div>
      <div class="detalhe-item">
        <div class="detalhe-label">CPF</div>
        <div class="detalhe-valor">${cliente.cpf || "Não informado"}</div>
      </div>
      <div class="detalhe-item">
        <div class="detalhe-label">Data de Nascimento</div>
        <div class="detalhe-valor">${cliente.dataNascimento ? formatarData(cliente.dataNascimento) : "Não informado"}</div>
      </div>
    </div>

    <div class="detalhe-row">
      <div class="detalhe-item">
        <div class="detalhe-label">Telefone</div>
        <div class="detalhe-valor">${cliente.telefone || "Não informado"}</div>
      </div>
      <div class="detalhe-item">
        <div class="detalhe-label">Email</div>
        <div class="detalhe-valor">${cliente.email || "Não informado"}</div>
      </div>
      <div class="detalhe-item">
        <div class="detalhe-label">Data Cadastro</div>
        <div class="detalhe-valor">${formatarData(cliente.dataCadastro)}</div>
      </div>
    </div>

    ${
      enderecoCompleto
        ? `
      <div class="detalhe-row">
        <div class="detalhe-item" style="grid-column: 1 / -1;">
          <div class="detalhe-label">Endereço</div>
          <div class="detalhe-valor">${enderecoCompleto}</div>
        </div>
      </div>
    `
        : ""
    }

    ${
      cliente.observacoes
        ? `
      <div class="detalhe-row">
        <div class="detalhe-item" style="grid-column: 1 / -1;">
          <div class="detalhe-label">Observações</div>
          <div class="detalhe-valor">${cliente.observacoes}</div>
        </div>
      </div>
    `
        : ""
    }
  `

  document.getElementById("clienteDetalhes").innerHTML = detalhesHTML
  document.getElementById("modalVisualizarCliente").classList.add("active")
}

function deletarClienteAtual() {
  const clienteDetalhes = document.getElementById("clienteDetalhes").innerText
  const cliente = clientes.find((c) => c.nome.includes(clienteDetalhes.split("\n")[1]))

  if (cliente && confirm(`Tem certeza que deseja deletar o cliente ${cliente.nome}?`)) {
    clientes = clientes.filter((c) => c.id !== cliente.id)
    localStorage.setItem("clientes", JSON.stringify(clientes))
    fecharModal("modalVisualizarCliente")
    carregarClientes()
    alert("✅ Cliente deletado com sucesso!")
  }
}

function deletarCliente(clienteId) {
  const cliente = clientes.find((c) => c.id === clienteId)
  if (!cliente) return

  if (confirm(`Tem certeza que deseja deletar o cliente ${cliente.nome}?`)) {
    clientes = clientes.filter((c) => c.id !== clienteId)
    localStorage.setItem("clientes", JSON.stringify(clientes))
    carregarClientes()
    alert("✅ Cliente deletado com sucesso!")
  }
}

function carregarClientesNoSelect() {
  const select = document.getElementById("clienteVenda")
  if (!select) return

  const selectedValue = select.value
  select.innerHTML = '<option value="">Selecione ou cadastre...</option>'

  clientes.forEach((cliente) => {
    const option = document.createElement("option")
    option.value = cliente.id
    option.textContent = `${cliente.nome}${cliente.telefone ? ` - ${cliente.telefone}` : ""}`
    select.appendChild(option)
  })

  select.value = selectedValue
}

function adicionarFormatacaoTelefone() {
  // Format phone number on input
  const formatarTelefone = (valor) => {
    let telefone = valor.replace(/\D/g, "")
    if (telefone.length > 11) telefone = telefone.slice(0, 11)
    if (telefone.length <= 2) return telefone
    if (telefone.length <= 6) return `(${telefone.slice(0, 2)}) ${telefone.slice(2)}`
    if (telefone.length <= 10) return `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`
    return `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7, 11)}`
  }

  const telefoneInputs = document.querySelectorAll('input[type="tel"]')
  telefoneInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      e.target.value = formatarTelefone(e.target.value)
    })
  })
}

function adicionarValidacaoRealtime() {
  const cpfInput = document.getElementById("clienteCPF")
  if (cpfInput) {
    cpfInput.addEventListener("blur", () => {
      const cpf = cpfInput.value.trim()
      if (cpf && !validarCPF(cpf)) {
        cpfInput.style.borderColor = "var(--danger)"
        cpfInput.title = "CPF inválido"
      } else {
        cpfInput.style.borderColor = ""
        cpfInput.title = ""
      }
    })
  }
}

function abrirCadastroRapidoCliente() {
  limparFormularioClienteRapido()
  document.getElementById("modalClienteRapido").classList.add("active")
}

function fecharCadastroRapido() {
  fecharModal("modalClienteRapido")
}

function limparFormularioClienteRapido() {
  document.getElementById("clienteRapidoNome").value = ""
  document.getElementById("clienteRapidoTelefone").value = ""
  document.getElementById("clienteRapidoEmail").value = ""
}

function salvarClienteRapido(event) {
  event.preventDefault()

  const nome = document.getElementById("clienteRapidoNome").value.trim()
  const telefone = document.getElementById("clienteRapidoTelefone").value.trim()
  const email = document.getElementById("clienteRapidoEmail").value.trim()

  if (!nome) {
    alert("Por favor, preencha o nome!")
    return
  }

  if (!telefone) {
    alert("Por favor, preencha o telefone!")
    return
  }

  if (email && !email.includes("@")) {
    alert("Email inválido!")
    return
  }

  const novoCliente = {
    id: Date.now().toString(),
    nome: nome,
    cpf: "",
    dataNascimento: "",
    telefone: telefone,
    email: email,
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
    dataCadastro: new Date().toISOString(),
  }

  clientes.push(novoCliente)
  localStorage.setItem("clientes", JSON.stringify(clientes))

  carregarClientesNoSelect()
  document.getElementById("clienteVenda").value = novoCliente.id
  selecionarCliente()

  fecharModal("modalClienteRapido")
  alert("✅ Cliente criado e selecionado para venda!")
}

function selecionarCliente() {
  const clienteId = document.getElementById("clienteVenda").value
  const clienteSelecionadoDiv = document.getElementById("clienteSelecionado")

  if (!clienteId) {
    clienteSelecionadoDiv.style.display = "none"
    return
  }

  const cliente = clientes.find((c) => c.id === clienteId)
  if (cliente) {
    document.getElementById("clienteNomeSelecionado").textContent = cliente.nome
    document.getElementById("clienteTelefoneSelecionado").textContent = cliente.telefone
    clienteSelecionadoDiv.style.display = "block"
  }
}

function exportarClientesCSV() {
  if (clientes.length === 0) {
    alert("Nenhum cliente para exportar!")
    return
  }

  let csv = "Nome,CPF,Telefone,Email,Cidade,Data Cadastro\n"

  clientes.forEach((cliente) => {
    csv += `"${cliente.nome}","${cliente.cpf || ""}","${cliente.telefone || ""}","${cliente.email || ""}","${cliente.cidade || ""}","${formatarData(cliente.dataCadastro)}"\n`
  })

  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// Declare fecharModal function
function fecharModal(modalId) {
  document.getElementById(modalId).classList.remove("active")
}

// Declare formatarData function
function formatarData(data) {
  return new Date(data).toLocaleDateString()
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar")
  sidebar.classList.toggle("active")

  // Fechar sidebar ao clicar em um item (mobile)
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      sidebar.classList.remove("active")
    }, 300)
  }
}

function changeTabSidebar(tabName) {
  // Atualizar navbar existente
  window.changeTab(tabName)

  // Atualizar estado ativo do sidebar
  const sidebarItems = document.querySelectorAll(".sidebar-nav-item")
  sidebarItems.forEach((item) => {
    item.classList.remove("active")
  })

  // Encontrar e ativar o item correto
  const navItems = document.querySelectorAll(".nav-tabs .nav-tab")
  navItems.forEach((item) => {
    item.classList.remove("active")
  })

  // Marcar como ativo no sidebar
  const sidebarItem = document.querySelector(`.sidebar-nav-item[onclick*="'${tabName}'"]`)
  if (sidebarItem) {
    sidebarItem.classList.add("active")
  }

  // Marcar como ativo na navbar também
  const navTab = document.querySelector(`.nav-tabs .nav-tab[onclick*="'${tabName}'"]`)
  if (navTab) {
    navTab.classList.add("active")
  }
}

// Atualizar status do caixa no sidebar
function atualizarStatusSidebar() {
  const statusElement = document.getElementById("statusFooter")
  const statusNav = document.getElementById("caixaStatus")

  if (statusNav && statusElement) {
    statusElement.textContent = statusNav.textContent
    statusElement.className = statusNav.className.replace("caixa-status", "").trim()
  }
}

// Sincronizar sidebar quando mudar de aba
const originalChangeTab = window.changeTab
window.changeTab = function (tabName) {
  originalChangeTab.call(this, tabName)
  changeTabSidebar(tabName)
}

// Atualizar sidebar em intervalos
setInterval(atualizarStatusSidebar, 1000)

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "b") {
    e.preventDefault()
    toggleSidebar()
  }
})
