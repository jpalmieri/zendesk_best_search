(function() {

  return {
    events: {
      'app.activated':'doSomething',
      'click #stringButton': 'doSearch',
      'searchMacros.done': 'handleResults',
      'getNextPage.done': 'handleResults'
    },

    requests: {
      searchMacros: function() {
        return {
          url: '/api/v2/macros.json',
          type: 'GET',
          dataType: 'json'
        };
      },

      getNextPage: function(url) {
        return {
          url: url,
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    doSomething: function() {
      this.switchTo('search');
    },

    doSearch: function() {
      this.$('.results ul').empty();
      this.$('#stringButton').prop('disabled', true);
      this.$('#stringButton').prop('value', 'Searching...');
      this.ajax('searchMacros');
      return false;
    },

    handleResults: function (data) {
      console.log(data);
      var macros = data.macros;
      var results = [];
      var query = this.$("#search").val();
      var that = this;

      macros.forEach( function(macro) {
        results.push( that.getTagMatches(macro, query) );
      });

      // Render the template
      var resultsTemplate = this.renderTemplate('results', {results: results} );

      // Insert rendered template into the results div
      this.$('.results ul').append(resultsTemplate);

      if (data.next_page){
        this.ajax('getNextPage', data.next_page);
      } else {
        this.$('#stringButton').prop('disabled', false);
        this.$('#stringButton').prop('value', 'Search Macros');
      }
      this.$('.count').text("Displaying " + this.$('.results ul li').length + " matches");
    },

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

    getTagMatches: function(macro, query) {
      var tags = this.getValues(macro);
      if ( tags.indexOf(query) > -1 ) {
        return macro;
      }
    }
  };

}());
