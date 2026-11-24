# Søren K. Haug - Platform Engineer

Source for my resume site, [soren.haug.dk](https://soren.haug.dk/). I'm a Platform Engineer at SAAB Danmark A/S, building AI tooling for developers, with a background in test automation, CI/CD and embedded software.

## 📬 Get In Touch

- [Portfolio Website](https://soren.haug.dk/)
- [LinkedIn](https://www.linkedin.com/in/s%C3%B8ren-kj%C3%A6degaard-haug-0723855a/)

## Checking changes

The site has no build step, but it has a test suite. It opens the page in your installed Chrome at desktop, tablet and phone sizes, with and without JavaScript, then runs the HTML validator:

```
npm install
npm test
```

`npm run test:shots` also saves a screenshot of each state to `tests/shots/`. If Chrome isn't found, set `CHROME_PATH` to its executable.

---

Feel free to explore my repositories to see more of my work, or reach out if you'd like to discuss potential opportunities.