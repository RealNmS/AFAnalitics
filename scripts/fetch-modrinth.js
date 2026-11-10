import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ID = "yd14I2wN";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const historyPath = path.join(__dirname, "../data/history.json");

async function fetchModrinthData() {
    console.log("Fetching Modrinth data...");

    const response = await fetch(
        `https://api.modrinth.com/v2/project/${PROJECT_ID}`,
        {
            headers: {
                "User-Agent": "RealNmS/AFAnalitics"
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `Modrinth API request failed: ${response.status} ${response.statusText}`
        );
    }

    const project = await response.json();

    console.log(`Project: ${project.title}`);
    console.log(`Downloads: ${project.downloads}`);
    console.log(`Followers: ${project.followers}`);

    return {
        id: project.id,
        title: project.title,
        downloads: project.downloads,
        followers: project.followers
    };
}

function getToday() {
    return new Date().toISOString().split("T")[0];
}

async function main() {
    const modrinth = await fetchModrinthData();

    let history = [];

    if (fs.existsSync(historyPath)) {
        const file = fs.readFileSync(historyPath, "utf8");

        if (file.trim()) {
            history = JSON.parse(file);
        }
    }

    const today = getToday();

    const snapshot = {
        date: today,
        modrinth: {
            downloads: modrinth.downloads,
            followers: modrinth.followers
        }
    };

    const existingIndex = history.findIndex(
        entry => entry.date === today
    );

    if (existingIndex !== -1) {
        console.log("Today's snapshot already exists. Updating it.");
        history[existingIndex] = snapshot;
    } else {
        console.log("Adding new daily snapshot.");
        history.push(snapshot);
    }

    fs.writeFileSync(
        historyPath,
        JSON.stringify(history, null, 2) + "\n"
    );

    console.log(`Saved data for ${today}.`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
