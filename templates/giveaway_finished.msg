Giveaway is finished! Winners:

{{#each .}}
<@{{this.userId}}>
{{#if @last}}

Congratulations.
{{/if}}
{{else}}
There are no winners this time.
{{/each}}
