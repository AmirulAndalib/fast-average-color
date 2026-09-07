# Development

```
git clone git@github.com:fast-average-color/fast-average-color.git ./fast-average-color
cd ./fast-average-color

npm i
npm test
```

Installing dependencies also builds the library and configures Husky 9.
The `.husky/pre-commit` hook runs `npm test` before each commit.
GitHub Actions uses Node.js 26 and sets `HUSKY=0` to skip hook installation;
the workflows run the tests explicitly.
