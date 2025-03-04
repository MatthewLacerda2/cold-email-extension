# Cold Email Generator

## How to install:

```shell
$ cd cold-email

$ npm install
$ npm run build
```

## Chrome Extension Developer Mode

1. set your Chrome browser 'Developer mode' up
2. click 'Load unpacked', and select `cold-email/build` folder

### How does this works

1. At `r_jina_ai.ts`, we fetch from `https://r.jina.ai/`, which takes a given URL and returns it's content in a nice format friendly to LLMs
2. At `gemini.ts`, we send a prompt to Google Gemini's API to write a cold-email for us, alongside the page's content

The rest of the action happens in the SidePanel.tsx and .css. There isn't much in the other project files