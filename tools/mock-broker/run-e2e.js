const puppeteer = require('puppeteer');

(async () => {
    console.log("Starting autonomous multi-browser test...");
    const browser = await puppeteer.launch({ headless: true });

    async function createPlayer(name) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        
        page.on('console', msg => {
            console.log(`[Browser ${name} Console]:`, msg.text());
        });

        await page.goto('http://localhost:4200');
        await page.evaluate(() => localStorage.clear());
        await page.goto('http://localhost:4200'); // Reload to generate new ID
        
        await new Promise(r => setTimeout(r, 2000)); // wait 2s for mqtt

        await page.waitForSelector('input[placeholder="Enter your name"]');
        await page.type('input[placeholder="Enter your name"]', name);
        await page.click('button.gold-btn'); // Login button
        
        await page.waitForFunction(() => document.body.innerText.includes('Lobby Roster'), { timeout: 10000 });
        return page;
    }

    try {
        console.log("Registering P1, P2, P3...");
        const p1 = await createPlayer("P1");
        const p2 = await createPlayer("P2");
        const p3 = await createPlayer("P3");

        console.log("Voting to start with P1 and P2...");
        await p1.waitForFunction(() => Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Vote to Start')));
        await p1.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Vote to Start')).click());
        await p2.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Vote to Start')).click());
        await p3.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Vote to Start')).click());

        console.log("Waiting for game to initialize (MOVEMENT_CHOICE)...");
        await p1.waitForSelector('app-tactical-grid', { timeout: 10000 });
        console.log("Game initialized!");

        console.log("Test finished successfully without crashing.");
    } catch(err) {
        console.error("Test failed:", err);
    } finally {
        await browser.close();
    }
})();
