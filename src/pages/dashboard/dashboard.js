// GSAP agora é carregado via CDN no HTML para garantir que funcione
// em qualquer ambiente sem depender do bundler imediatamente.

function initDashboard() {
    
    // --- Dados Simulados (Backend Mock) ---
    const vivenciaData = {
        totalVagas: 30,
        preenchidas: 28,
    };
    
    const kiwifyData = {
        totalLivros: 500,
        vendidos: 412,
    };

    // --- 1. Inicializar Data Atual ---
    const dateEl = document.getElementById('current-date');
    if(dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('pt-BR', options);
    }

    // --- 2. Animação de Autenticação (Overlay) ---
    const overlay = document.getElementById('auth-overlay');
    const layout = document.querySelector('.dashboard-layout');
    const authProgress = document.querySelector('.auth-progress');
    
    if(overlay && layout && authProgress) {
        
        // Simula carregamento (fake auth)
        gsap.to(authProgress, {
            width: "100%",
            duration: 1.8,
            ease: "power2.inOut",
            onComplete: () => {
                
                // Esconde a tela de auth e mostra o dashboard
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.8,
                    onComplete: () => {
                        overlay.style.display = "none";
                        layout.style.display = "flex";
                        
                        // Inicia as animações do Dashboard
                        initDashboardAnimations();
                    }
                });
            }
        });
    }

    // --- 3. Inicialização e Animação do Dashboard ---
    function initDashboardAnimations() {
        
        // Entrada dos elementos
        const tl = gsap.timeline();
        
        tl.from(".dash-sidebar", { x: -50, opacity: 0, duration: 0.6, ease: "power2.out" })
          .from(".dash-header", { y: -20, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.3")
          .from(".dash-card", { 
              y: 30, 
              opacity: 0, 
              duration: 0.6, 
              stagger: 0.15, 
              ease: "back.out(1.2)" 
          }, "-=0.2");

        // Atualizar KPI da Vivência
        updateVivenciaKPI();
        
        // Montar e animar Gráfico do Kiwify
        initKiwifyChart();
    }

    // --- 4. Lógica do KPI de Vagas (Vivência) ---
    function updateVivenciaKPI() {
        const vagasPreenchidasEl = document.getElementById('vagas-preenchidas');
        const vagasRestantesEl = document.getElementById('vagas-restantes');
        const barEl = document.getElementById('vagas-bar');
        const pctEl = document.getElementById('ocupacao-pct');
        
        const restantes = vivenciaData.totalVagas - vivenciaData.preenchidas;
        const porcentagem = Math.round((vivenciaData.preenchidas / vivenciaData.totalVagas) * 100);

        // Animação dos números
        gsap.to({ val: 0 }, {
            val: vivenciaData.preenchidas,
            duration: 1.5,
            ease: "power1.out",
            onUpdate: function() {
                vagasPreenchidasEl.textContent = Math.floor(this.targets()[0].val);
            }
        });

        gsap.to({ val: 0 }, {
            val: restantes,
            duration: 1.5,
            ease: "power1.out",
            onUpdate: function() {
                vagasRestantesEl.textContent = Math.floor(this.targets()[0].val);
            }
        });

        // Animação da barra de progresso
        gsap.to(barEl, {
            width: `${porcentagem}%`,
            duration: 1.5,
            delay: 0.5,
            ease: "power3.out"
        });

        // Contador da porcentagem
        gsap.to({ pct: 0 }, {
            pct: porcentagem,
            duration: 1.5,
            delay: 0.5,
            ease: "power3.out",
            onUpdate: function() {
                pctEl.textContent = `${Math.floor(this.targets()[0].pct)}%`;
            }
        });
    }

    // --- 5. Gráfico de Pizza (Chart.js para Livros no Kiwify) ---
    function initKiwifyChart() {
        const ctx = document.getElementById('bookSalesChart');
        if(!ctx) return;

        const emEstoque = kiwifyData.totalLivros - kiwifyData.vendidos;
        
        // Preenche o número total no meio do doughnut
        document.getElementById('total-books').textContent = kiwifyData.totalLivros;

        // Configuração premium do Chart.js
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Vendidos (Kiwify)', 'Em Estoque'],
                datasets: [{
                    data: [kiwifyData.vendidos, emEstoque],
                    backgroundColor: [
                        '#E2BC74', // Dourado Preciosa para vendas
                        'rgba(255, 255, 255, 0.05)' // Translúcido para estoque
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%', // Faz o buraco central grande para o número caber
                plugins: {
                    legend: {
                        display: false // Usamos a nossa legenda em HTML customizada
                    },
                    tooltip: {
                        backgroundColor: '#1F0D15',
                        titleFont: { family: 'Inter', size: 13 },
                        bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                        padding: 12,
                        borderColor: 'rgba(226, 188, 116, 0.3)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.parsed} exemplares`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
}

// Executa a inicialização de forma segura (garante que roda mesmo em type="module")
if (document.readyState === "loading") {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
