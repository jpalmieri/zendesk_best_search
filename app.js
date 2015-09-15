(function() {

  var MACROS_URI = '/api/v2/macros.json';

  return {
    events: {
      'app.activated':                      'initialize',
      'click .tagButton':                   'tagSearch',
      'click .commentButton':               'commentSearch',
      'requestMacrosForTagSearch.done':     'filterTagResults',
      'requestMacrosForCommentSearch.done': 'filterCommentResults'
    },

    requests: {
      requestMacrosForTagSearch: function(url) {
        return {
          url: url || MACROS_URI,
          type: 'GET',
          dataType: 'json'
        };
      },

      requestMacrosForCommentSearch: function(url) {
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
      this.$('.searchButton').prop('disabled', true);
      this.$('.query').prop('disabled', true);
      this.$('.searchButton').prop('value', 'Searching...');
      return false;
    },

    finishSearch: function() {
      this.$('.searchButton').prop('disabled', false);
      this.$('.query').prop('disabled', false);
      this.$('.searchButton').prop('value', 'Search');
    },

    tagSearch: function() {
      this.startSearch();
      this.ajax('requestMacrosForTagSearch');
    },

    commentSearch: function() {
      this.startSearch();
      this.ajax('requestMacrosForCommentSearch');
    },

    filterTagResults: function(data) {
      console.log(data);
      var self = this;
      var results = [];
      var query = this.$('.tagQuery').val();
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
        this.finishSearch();
      }
    },

    filterCommentResults: function(data) {
      console.log(data);
      var self = this;
      var results = [];
      var query = this.$('.commentQuery').val();
      var macros = data.macros;
      macros.forEach( function(macro) {
        var comments = self.getComments(macro);
        comments.forEach( function(comment) {
          if ( comment && comment.indexOf(query) > -1 ) {
            results.push(macro);
          }
        });
      });

      this.displayResults(results);

      // Get additional pages of api request results
      if (data.next_page){
        this.ajax('requestMacrosForCommentSearch', data.next_page);
      } else {
        this.finishSearch();
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

    getComments: function(macro) {
      var actions = this.getMacroActions(macro);
      var comments = [];
      actions.forEach( function(action) {
        if (action.field == "comment_value") {
          comments.push( action.value[1] );
        }
      });
      return comments;
    }

  };

}());
