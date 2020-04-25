```
CCX pools info

  {{#each .}}
    Name: {{this.info.name}}
    Height: {{this.network.height}}
    Hashrate: {{this.pool.hashrate}}
    Miners: {{this.pool.miners}}
    Payment Treshold: {{this.config.minPaymentThreshold}}
    Pool Free: {{this.config.poolFee}}

  {{/each}}
```