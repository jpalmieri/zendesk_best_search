(function() {

  var MACROS_URI = '/api/v2/macros.json';

  return {
    events: {
      'app.activated':                      'initialize',
      'click .tagButton':                   'tagSearch',
      'requestMacrosForTagSearch.done':     'filterTagResults'
    },

    requests: {
      requestMacrosForTagSearch: function(url) {
        return {
          url: url || MACROS_URI,
          type: 'GET',
          dataType: 'json'
        };
      },
    },

    initialize: function() {
      this.switchTo('search');
    },

    startSearch: function() {
      this.$('.results ul').empty();
      this.$('.tagButton').prop('disabled', true);
      this.$('.tagButton').prop('value', 'Searching...');
      return false;
    },

    tagSearch: function() {
      this.startSearch();
      this.ajax('requestMacrosForTagSearch');
    },

    filterTagResults: function(data) {
      console.log(data);
      var self = this;
      var results = [];
      var query = this.$("#search").val();
      var macros = data.macros;
      macros.forEach( function(macro) {
        var tags = self.getValues(macro);
        if ( tags.indexOf(query) > -1 ) {
          results.push(macro);
        }
      });

      this.displayResults(results);

      // Get additional pages of api request results
      if (data.next_page){
        this.ajax('requestMacrosForTagSearch', data.next_page);
      } else {
        this.$('.tagButton').prop('disabled', false);
        this.$('.tagButton').prop('value', 'Search Macros');
      }
    },

    displayResults: function (results) {
      // Render the template
      var resultsTemplate = this.renderTemplate('results', {results: results} );

      // Insert rendered template into the results div
      this.$('.results ul').append(resultsTemplate);

      // Display result count
      this.$('.count').text("Displaying " + this.$('.results ul li').length + " matches");

    },

    // Helpers

    getMacroActions: function(macro) {
      var actions = [];
      macro.actions.forEach( function(action) {
        actions.push(action);
      });
      return actions;
    },

    getValues: function(macro) {
      var actions = this.getMacroActions(macro);
      var values = [];
      actions.forEach( function(action) {
        values.push(action.value);
      });
      return values;
    },

  };

}());
