(function() {

  var MACROS_URI = '/api/v2/macros.json';

  return {
    events: {
      'pane.activated':                     'initialize',
      'click .search.btn':                  'startSearch',
      'requestMacros.done':                 'filterResults',
      'click .stop.btn':                    'stopSearch'
    },

    requests: {
      requestMacros: function(url) {
        return {
          url: url || MACROS_URI,
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    initialize: function() {
      this.switchTo('search');
      this.stopped = true;
      this.$('.query.date').datepicker({ dateFormat: "yy-mm-dd" });
      console.log('datepicker');
    },

    startSearch: function() {
      if ( this.$('.check:checked').length < 1 ) {
        services.notify("Please check at least one condition's checkbox.", 'alert');
      } else {
        this.stopped = false;
        this.$('.stop.btn').show();
        this.$('.count').text('');
        this.$('.results ul').empty();
        this.$('.search.btn').prop('disabled', true);
        this.$('.query').prop('disabled', true);
        this.$('.search.btn').prop('value', 'Searching...');
        this.ajax('requestMacros');
      }
      return false;
    },

    stopSearch: function() {
      this.stopped = true;
    },

    finishSearch: function() {
      this.$('.search.btn').prop('disabled', false);
      this.$('.query').prop('disabled', false);
      this.$('.search.btn').prop('value', 'Search');
      this.$('.stop.btn').hide();
      this.stopped = true;
    },

    filterResults: function(data) {
      console.log(data);
      var results = data.macros;

      if ( this.$('.check.tag').is(':checked') ) {
        results = this.filterTagResults(results);
      }
      if ( this.$('.check.comment').is(':checked') ) {
        results = this.filterCommentResults(results);
      }
      if ( this.$('.check.updated').is(':checked') ) {
        results = this.filterByUpdatedDate(results);
      }

      this.displayResults(results);

      // Get additional pages of api request results
      if (data.next_page && !this.stopped){
        this.ajax('requestMacros', data.next_page);
      } else {
        this.finishSearch();
      }
    },

    filterTagResults: function(macros) {
      var results = [];
      var query = this.$('.query.tag').val().toLowerCase();

      macros.forEach( function(macro) {
        var tags = this.getValues(macro);
        if ( tags.indexOf(query) > -1 ) {
          results.push(macro);
        }
      }.bind(this) );

      return results;
    },

    filterCommentResults: function(macros) {
      var results = [];
      var query = this.$('.query.comment').val().toLowerCase();

      macros.forEach( function(macro) {
        var comments = this.getComments(macro);
        comments.forEach( function(comment) {
          if ( comment.indexOf(query) > -1 ) {
            results.push(macro);
          }
        });
      }.bind(this) );

      return results;
    },

    filterByUpdatedDate: function(macros) {
      var results = [];
      var startDate = new Date( this.$('.query.updated.start-date').val() );
      var endDate = new Date( this.$('.query.updated.end-date').val() );

      macros.forEach( function(macro) {
        var updatedDate = new Date(macro.updated_at);
        if ( updatedDate > startDate && updatedDate < endDate) {
          results.push(macro);
        }
      });

      return results;
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
        if (action.value && action.field == "comment_value") {
          comments.push( action.value[1].toLowerCase() );
        }
      });
      return comments;
    }

  };

}());
