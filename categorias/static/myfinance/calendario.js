const textoMes = new Intl.DateTimeFormat("pt-BR", {month: "long", year: "numeric"});

function botao(texto, classe, acao) {
  const elemento = document.createElement("button");
  elemento.type = "button";
  elemento.className = classe;
  elemento.textContent = texto;
  elemento.addEventListener("click", acao);
  return elemento;
}

for (const campo of document.querySelectorAll("[data-calendario]")) {
  const painel = document.createElement("div");
  painel.className = "calendario border rounded p-2 mt-2";
  painel.id = campo.id + "_calendario";
  painel.hidden = true;
  let mes, ano;

  const abrir = botao("Abrir calendário", "btn btn-sm btn-outline-secondary mt-2", () => {
    painel.hidden = !painel.hidden;
    abrir.setAttribute("aria-expanded", String(!painel.hidden));
    if (!painel.hidden) {
      const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(campo.value);
      const hoje = new Date();
      const mesCampo = partes ? Number(partes[2]) - 1 : -1;
      mes = mesCampo >= 0 && mesCampo <= 11 ? mesCampo : hoje.getMonth();
      ano = mesCampo >= 0 && mesCampo <= 11 ? Number(partes[3]) : hoje.getFullYear();
      renderizar();
      painel.querySelector("button").focus();
    }
  });
  abrir.setAttribute("aria-controls", painel.id);
  abrir.setAttribute("aria-expanded", "false");
  campo.after(abrir, painel);

  function mover(delta) {
    const proximo = new Date(0);
    proximo.setFullYear(ano, mes + delta, 1);
    mes = proximo.getMonth();
    ano = proximo.getFullYear();
    renderizar();
    painel.querySelector(delta < 0 ? ".mes-anterior" : ".mes-seguinte").focus();
  }

  function renderizar() {
    const primeiro = new Date(0);
    primeiro.setFullYear(ano, mes, 1);
    const ultimo = new Date(0);
    ultimo.setFullYear(ano, mes + 1, 0);

    const cabecalho = document.createElement("div");
    cabecalho.className = "d-flex align-items-center justify-content-between gap-2 mb-2";
    const titulo = document.createElement("strong");
    titulo.textContent = textoMes.format(primeiro);
    titulo.setAttribute("aria-live", "polite");
    const anterior = botao("‹", "btn btn-sm btn-outline-secondary mes-anterior", () => mover(-1));
    anterior.setAttribute("aria-label", "Mês anterior");
    const seguinte = botao("›", "btn btn-sm btn-outline-secondary mes-seguinte", () => mover(1));
    seguinte.setAttribute("aria-label", "Mês seguinte");
    cabecalho.append(anterior, titulo, seguinte);

    const grade = document.createElement("div");
    grade.className = "calendario-grade";
    for (const dia of ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]) {
      const coluna = document.createElement("small");
      coluna.textContent = dia;
      grade.append(coluna);
    }
    for (let vazio = 0; vazio < primeiro.getDay(); vazio++) grade.append(document.createElement("span"));
    for (let dia = 1; dia <= ultimo.getDate(); dia++) {
      const escolhido = [String(dia).padStart(2, "0"), String(mes + 1).padStart(2, "0"),
        String(ano).padStart(4, "0")].join("/");
      const opcao = botao(String(dia), "btn btn-sm btn-light px-0", () => {
        campo.value = escolhido;
        painel.hidden = true;
        abrir.setAttribute("aria-expanded", "false");
        campo.focus();
      });
      opcao.setAttribute("aria-label", escolhido);
      grade.append(opcao);
    }
    painel.replaceChildren(cabecalho, grade);
  }

  painel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      painel.hidden = true;
      abrir.setAttribute("aria-expanded", "false");
      abrir.focus();
    }
  });
}
