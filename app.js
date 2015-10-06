(function() {

  var MACROS_URI = '/api/v2/macros.json';

  return {
    events: {
      'app.activated':                      'initialize',
      'pane.activated':                     'activate',
      'click .search.btn':                  'startSearch',
      'requestMacros.done':                 'filterResults',
      'click .stop.btn':                    'stopSearch',
      'mousedown .results th':              'beforeSort',
      'mouseup .results th':                'sortTable'
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
    },

    activate: _.once(function() {
      this.$('.query.date').datepicker({ dateFormat: "yy-mm-dd" });
    }),

    beforeSort: function(event) {
      this.$('.icon-loading-spinner').css('display', 'inline-block');
      var $th = this.$(event.target);
      $th.addClass('sorted');
      $th.siblings().removeClass('sorted ascending');
      $th.toggleClass('ascending');
    },

    // Toggles acending/decending order of the column header clicked
    sortTable: function(event) {
      var $th = this.$(event.target);
      var position = $th.index();
      var $tableBody = $th.closest('table').find('tbody');

      var newList = _.sortBy( $tableBody.find('tr'), function(el) {
        return this.$(el).find('td:eq(' + position + ')').text().toLowerCase();
      }.bind(this) );

      if ( $th.hasClass('ascending') ) {
        $tableBody.empty().append(newList);
      } else {
        $tableBody.empty().append( newList.reverse() );
      }

      this.$('.icon-loading-spinner').hide();
    },

    startSearch: function() {
      if ( this.$('.search-options .check:checked').length < 1 ) {
        services.notify("Please check at least one condition's checkbox.", 'alert');
      } else {
        this.$('.results table').show();
        this.$('.results tbody').empty();
        this.$('.results th').removeClass('sorted ascending');
        this.stopped = false;
        this.$('.icon-loading-spinner').css('display', 'inline-block');
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
      this.$('.icon-loading-spinner').hide();
    },

    filterResults: function(data) {
      var results = data.macros;

      if ( this.$('.check.tag').is(':checked') ) {
        results = this.filterTagResults(results);
      }
      if ( this.$('.check.comment').is(':checked') ) {
        results = this.filterCommentResults(results);
      }
      if ( this.$('.check.created').is(':checked') ) {
        results = this.filterByCreatedDate(results);
      }
      if ( this.$('.check.updated').is(':checked') ) {
        results = this.filterByUpdatedDate(results);
      }
      if ( !this.$('.check.status').is(':checked') ) {
        results = _.filter(results, function(macro) { return macro.active === true; });
      }

      // Remove times from dates
      _.each(results, function(macro) {
        macro.created_at = macro.created_at.substring(0,10);
        macro.updated_at = macro.updated_at.substring(0,10);
      });

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

      _.each(macros, function(macro) {
        var tags = this.getValues(macro);
        // Filter our tags which don't match query
        tags = _.filter(tags, function(tag) { return tag.indexOf(query) > -1; });
        if ( tags.length > 0 ) {
          results.push(macro);
        }
      }.bind(this) );

      return results;
    },

    filterCommentResults: function(macros) {
      var results = [];
      var query = this.$('.query.comment').val().toLowerCase();

      _.each(macros, function(macro) {
        var comments = this.getComments(macro);
        // Filter our comments which don't match query
        comments = _.filter(comments, function(comment) { return comment.indexOf(query) > -1; });
        if ( comments.length > 0 ) {
          results.push(macro);
        }
      }.bind(this) );

      return results;
    },

    filterByUpdatedDate: function(macros) {
      var results = [];
      var startDate = new Date( this.$('.query.updated.start-date').val() );
      var endDate = new Date( this.$('.query.updated.end-date').val() );

      _.each(macros, function(macro) {
        var updatedDate = new Date(macro.updated_at);
        if ( updatedDate > startDate && updatedDate < endDate) {
          results.push(macro);
        }
      });

      return results;
    },

    filterByCreatedDate: function(macros) {
      var results = [];
      var startDate = new Date( this.$('.query.created.start-date').val() );
      var endDate = new Date( this.$('.query.created.end-date').val() );

      _.each(macros, function(macro) {
        var createdDate = new Date(macro.created_at);
        if ( createdDate > startDate && createdDate < endDate) {
          results.push(macro);
        }
      });

      return results;
    },

    displayResults: function (results) {
      // Render the template
      var resultsTemplate = this.renderTemplate('results', {results: results} );

      // Insert rendered template into the results div
      this.$('.results tbody').append(resultsTemplate);

      // Display result count
      this.$('.count').html("Displaying " + this.$('.results tbody tr').length + " results");

    },

    // Helpers

    getMacroActions: function(macro) {
      var actions = [];
      _.each(macro.actions, function(action) {
        actions.push(action);
      });
      return actions;
    },

    getValues: function(macro) {
      var actions = this.getMacroActions(macro);
      var values = [];
      _.each(actions, function(action) {
        if (action.value) { values.push(action.value); }
      });
      return values;
    },

    getComments: function(macro) {
      var actions = this.getMacroActions(macro);
      var comments = [];
      _.each(actions, function(action) {
        if (action.value && action.field == "comment_value") {
          comments.push( action.value[1].toLowerCase() );
        }
      });
      return comments;
    }

  };

}());
