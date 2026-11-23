const dadosGrafico = document.getElementById("dados-financeiros");
const canvasGrafico = document.getElementById("grafico-financeiro");

if (dadosGrafico && canvasGrafico && typeof Chart === "function") {
  const dados = JSON.parse(dadosGrafico.textContent);
  const movimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  try {
    const grafico = new Chart(canvasGrafico, {
      type: "doughnut",
      data: {
        labels: ["Receitas", "Despesas"],
        datasets: [{
          data: dados.proporcoes,
          backgroundColor: ["#177a62", "#d58536"],
          borderWidth: 0,
        }],
      },
      options: {
        locale: "pt-BR",
        animation: movimento.matches ? false : {duration: 500},
        plugins: {
          legend: {display: false},
          tooltip: {callbacks: {label: (item) => dados.valores[item.dataIndex]}},
        },
      },
    });
    movimento.addEventListener("change", (evento) => {
      if (evento.matches) grafico.stop();
      grafico.options.animation = evento.matches ? false : {duration: 500};
      grafico.update("none");
    });
  } catch (erro) {
    canvasGrafico.hidden = true;
  }
}
