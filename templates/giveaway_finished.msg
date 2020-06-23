Giveaway is finished! Winners:

{{#each .}}
{{#if this.muted}}
{{this.userName}}
{{else}}
<@{{this.userId}}>
{{/if}}
{{#if @last}}

Congratulations.
{{/if}}
{{else}}
There are no winners this time.
{{/each}}
