Giveaway is finished! Winners: 

{{#each .}}
{{#if (eq this.status true)}} 
SUCCESS: <@{{this.user.id}}>
{{else}}
FAILED: <@{{this.user.id}}>
{{/if}}
{{#if @last}} 

Congratulations.
{{/if}}
{{else}}
There is no winners this time.
{{/each}}