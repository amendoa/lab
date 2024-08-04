# Use Github Gists as CMS [[Demo :globe_with_meridians:](https://amendoa.dev/lab/github-gists-as-cms)]


You can create multiple files in a [Gist](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists#about-gists). The idea is to use these files to generate static pages for a website.

# How it works?

Github gists provides a embed script:

![image](https://github.com/user-attachments/assets/adf37a24-41e2-4871-bd84-337f0cb1f434)

Fetching this script src you can see some `document.write` scripts:

![image](https://github.com/user-attachments/assets/959522d9-273d-44aa-8aed-5878ddb1e6a5)

These scripts are injecting an css and html (.md parsed to HTML). I noticed that I could inject them manually and use this data for SSG.

So, the process is:

1. Fetch embed src script
2. Capture content using Regex
3. Inject the content in a HTMl using some bundler ou task runner
