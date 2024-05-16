module.exports = {
  printWidth: 160,
  overrides: [
    {
      files: '*.graphql',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.json',
      options: {
        "tabWidth": 2,
        "useTabs": false,
        "semi": false,
        "printWidth": 160,
        "singleQuote": true,
        "trailingComma": false
      },
    },
    {
      files: '*.ts',
      options: {
        "tabWidth": 2,
        "useTabs": false,
        "semi": false,
        "printWidth": 160,
        "singleQuote": true,
        "trailingComma": "all"
      },
    }
  ],
}
