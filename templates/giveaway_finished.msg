Giveaway is finished! Winners: 

{{#each .}}
<@{{this.userId}}>
{{#if @last}} 

Congratulations.
{{/if}}
{{else}}
There is no winners this time.
{{/each}}