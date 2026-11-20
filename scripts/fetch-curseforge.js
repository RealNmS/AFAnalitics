import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_SLUG = "atmospheric-fauna";
const GAME_ID = "432";
const API_BASE_URL = "https://api.curseforge.com/v1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const historyPath = path.join(__dirname, "../data/history.json");

async function curseForgeFetch(url, apiKey) {
    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "x-api-key": apiKey
        }
    });

    if (!response.ok) {
        throw new Error(
            `CurseForge API request failed: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

async function fetchCurseForgeData() {
    const apiKey = process.env.CURSEFORGE_API_KEY;

    if (!apiKey) {
        throw new Error("CURSEFORGE_API_KEY is not configured");
    }

    console.log("Fetching CurseForge data...");

    let projectId = process.env.CURSEFORGE_PROJECT_ID;

    if (!projectId) {
        const searchUrl =
            `${API_BASE_URL}/mods/search?gameId=${GAME_ID}` +
            `&slug=${encodeURIComponent(PROJECT_SLUG)}&pageSize=1`;
        const search = await curseForgeFetch(searchUrl, apiKey);
        const project = search.data?.find(
            item => item.slug === PROJECT_SLUG
        );

        if (!project) {
            throw new Error(
                `CurseForge project "${PROJECT_SLUG}" was not found`
            );
        }

        projectId = String(project.id);
    }

    const project = await curseForgeFetch(
        `${API_BASE_URL}/mods/${encodeURIComponent(projectId)}`,
        apiKey
    );

    if (!project.data) {
        throw new Error("CurseForge API returned no project data");
    }

    console.log(`Project: ${project.data.name}`);
    console.log(`Downloads: ${project.data.downloadCount}`);

    return {
        id: project.data.id,
        name: project.data.name,
        downloads: project.data.downloadCount
    };
}

function getToday() {
    return new Date().toISOString().split("T")[0];
}

async function main() {
    const curseForge = await fetchCurseForgeData();

    let history = [];

    if (fs.existsSync(historyPath)) {
        const file = fs.readFileSync(historyPath, "utf8");

        if (file.trim()) {
            history = JSON.parse(file);
        }
    }

    const today = getToday();
    const existingIndex = history.findIndex(entry => entry.date === today);

    if (existingIndex !== -1) {
        console.log("Today's snapshot already exists. Updating it.");
        history[existingIndex] = {
            ...history[existingIndex],
            curseforge: {
                downloads: curseForge.downloads
            }
        };
    } else {
        console.log("Adding new daily snapshot.");
        history.push({
            date: today,
            curseforge: {
                downloads: curseForge.downloads
            }
        });
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
