(function() {

  return {
    events: {
      'app.activated':'doSomething',
      'click #stringButton': 'doSearch',
      'searchMacros.done': 'handleResults'
    },

    requests: {
      searchMacros: function(data) {
        return {
          url: '/api/v2/macros.json',
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    doSomething: function() {
      this.switchTo('search');
    },

    doSearch: function() {
      this.ajax('searchMacros');
      return false;
    },

    handleResults: function (data) {
      console.log(data.macros);
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
      this.$('.results').html(resultsTemplate);
    },

    getMacroActions: function(macro) {
      var actions = [];
      macro.actions.forEach( function(action) {
        actions.push(action);
      });
      return actions;
    },

    getCurrentTags: function(actions) {
      var tags = [];
      actions.forEach( function(action) {
        if (action.field == "current_tags") {
          tags.push(action.value);
        }
      });
      return tags;
    },

    getTagMatches: function(macro, query) {
      var actions = this.getMacroActions(macro);
      var tags = this.getCurrentTags(actions);
      if ( tags.indexOf(query) > -1 ) {
        return macro;
      } else {
        return '';
      }
    }
  };

}());
