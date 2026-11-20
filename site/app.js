async function loadAnalytics() {
    const response = await fetch("../data/history.json");

    if (!response.ok) {
        throw new Error("Failed to load analytics data");
    }

    return response.json();
}

function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

async function main() {
    const history = await loadAnalytics();

    if (history.length === 0) {
        console.log("No analytics data available yet.");
        return;
    }

    const latest = history[history.length - 1];
    const modrinthDownloads = latest.modrinth?.downloads ?? 0;
    const curseForgeDownloads = latest.curseforge?.downloads ?? 0;

    document.getElementById("modrinth-downloads").textContent =
        formatNumber(modrinthDownloads);

    document.getElementById("total-downloads").textContent =
        formatNumber(modrinthDownloads + curseForgeDownloads);

    document.getElementById("curseforge-downloads").textContent =
        curseForgeDownloads ? formatNumber(curseForgeDownloads) : "Not yet collected";

    document.getElementById("followers").textContent =
        formatNumber(latest.modrinth?.followers ?? 0);

    const chartState = {
        platform: "all",
        timeRange: "all",
        metric: "cumulative"
    };

    let downloadsChart;

    function updateChart() {
        if (downloadsChart) {
            downloadsChart.destroy();
        }

        downloadsChart = createDownloadsChart(
            history,
            chartState.platform,
            chartState.timeRange,
            chartState.metric
        );
    }

    document.querySelectorAll("#platform-controls button").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll("#platform-controls button").forEach(
                item => item.classList.remove("active")
            );
            button.classList.add("active");
            chartState.platform = button.dataset.platform;
            updateChart();
        });
    });

    document.querySelectorAll("#metric-controls button").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll("#metric-controls button").forEach(
                item => item.classList.remove("active")
            );
            button.classList.add("active");
            chartState.metric = button.dataset.metric;
            updateChart();
        });
    });

    document.getElementById("time-range").addEventListener("change", event => {
        chartState.timeRange = event.target.value;
        updateChart();
    });

    updateChart();
}

function getDailyValues(entries, key) {
    return entries.map((entry, index) => {
        const value = entry[key]?.downloads;

        if (value == null) {
            return null;
        }

        if (index === 0) {
            return null;
        }

        const previousValue = entries[index - 1][key]?.downloads;
        return previousValue == null
            ? null
            : Math.max(0, value - previousValue);
    });
}

function createDownloadsChart(history, platform, timeRange, metric) {
    const entries = timeRange === "all"
        ? history
        : history.slice(-Number(timeRange));

    const labels = entries.map(entry => entry.date);
    const datasets = [];
    const platforms = platform === "all"
        ? [
            { key: "modrinth", label: "Modrinth Downloads", borderColor: "#66c2a5" },
            { key: "curseforge", label: "CurseForge Downloads", borderColor: "#f4a261" }
        ]
        : [{
            key: platform,
            label: platform === "modrinth"
                ? "Modrinth Downloads"
                : "CurseForge Downloads",
            borderColor: platform === "modrinth" ? "#66c2a5" : "#f4a261"
        }];

    platforms.forEach(({ key, label, borderColor }) => {
        const data = metric === "daily"
            ? getDailyValues(entries, key)
            : entries.map(entry => entry[key]?.downloads ?? null);

        datasets.push({
            label: metric === "daily"
                ? label.replace("Downloads", "Downloads per Day")
                : label,
            data,
            borderColor,
            backgroundColor: `${borderColor}33`,
            tension: 0.3,
            spanGaps: false
        });
    });

    return new Chart(
        document.getElementById("downloads-chart"),
        {
            type: "line",

            data: {
                labels,
                datasets
            },

            options: {
                responsive: true,
                interaction: {
                    mode: "index",
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => formatNumber(value)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context =>
                                `${context.dataset.label}: ${formatNumber(context.parsed.y)}`
                        }
                    }
                }
            }
        }
    );
}

main().catch(console.error);
