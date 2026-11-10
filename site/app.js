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

    document.getElementById("modrinth-downloads").textContent =
        formatNumber(latest.modrinth.downloads);

    document.getElementById("total-downloads").textContent =
        formatNumber(latest.modrinth.downloads);

    document.getElementById("followers").textContent =
        formatNumber(latest.modrinth.followers);

    createDownloadsChart(history);
}

function createDownloadsChart(history) {
    const labels = history.map(entry => entry.date);

    const downloads = history.map(
        entry => entry.modrinth.downloads
    );

    new Chart(
        document.getElementById("downloads-chart"),
        {
            type: "line",

            data: {
                labels,

                datasets: [
                    {
                        label: "Modrinth Downloads",
                        data: downloads,
                        tension: 0.3
                    }
                ]
            },

            options: {
                responsive: true
            }
        }
    );
}

main().catch(console.error);
