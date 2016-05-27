(function() {

  var API_PATH = '/api/v2/';
  var ENDPOINT_PATH = {
    macro: 'macros/active.json',
    trigger: 'triggers/active.json',
    automation: 'automations/active.json',
    view: 'views/active.json'
  };

  return {
    events: {
      'app.activated':                      'initialize',
      'pane.activated':                     'activate',
      'click .search.btn':                  'startSearch',
      'requestRules.done':                  'filterResults',
      'click .stop.btn':                    'stopSearch',
      'mousedown .results th':              'beforeSort',
      'mouseup .results th':                'sortTable',
      'click .rules a':                     'switchSearchTemplate',
      'change .query':                      'handleChangedQuery',
      'keyup .query':                       'handleChangedQuery',
      'click .query-clear':                 'clearQuery'
    },

    requests: {
      requestRules: function(url) {
        return {
          url: url,
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    initialize: function() {
      this.stopped = true;
      this.initialized = true;
    },

    activate: function() {
      if (this.initialized) {
        // Load template associated with tab that has .active by default in html
        this.$('.rules .active a').trigger('click');
        this.initialized = false;
      }
    },

    switchSearchTemplate: function(event) {
      var $selectedOption = this.$(event.target).closest('li');
      var searchType = $selectedOption.data('type');
      var searchFormHtml = this.renderSearchForm(searchType);
      this.$('section[data-main]').html(searchFormHtml);
      this.$('.query.date').datepicker({ dateFormat: "yy-mm-dd" });
      // UI: Make current tab highlighted (and only current tab)
      $selectedOption.addClass('active').siblings().removeClass('active');
    },

    generateUrl: function() {
      var searchType = this.$('.rules a').closest('li.active').data('type');
      var includeInactive = this.$('.check.status').is(':checked');

      var url = API_PATH + ENDPOINT_PATH[searchType];

      // Use a different endpoint if returning inactive items (remove '/active')
      if (includeInactive) url = url.replace('/active', '');

      return url;
    },

    handleChangedQuery: function(event) {
      this.toggleSearch();

      // Show 'x' to clear input
      if ( this.$(event.target).val() ) {
        this.$(event.target).siblings('.query-clear').show();
      } else {
        this.$(event.target).siblings('.query-clear').hide();
      }
    },

    toggleSearch: function() {
      var atLeastOneQueryHasText = _.some(this.$('.query'), function(queryInput) {
        return this.$(queryInput).val();
      }.bind(this) );
      if ( atLeastOneQueryHasText ) {
        this.$('.search.btn').prop('disabled', false);
      } else {
        this.$('.search.btn').prop('disabled', true);
      }
    },

    clearQuery: function(event) {
      this.$(event.target).siblings('.query').val('').select();
      this.toggleSearch();
      this.$(event.target).hide();
    },

    startSearch: function() {
      this.$('.results table').show();
      this.$('.results tbody').empty();
      this.$('.results th').removeClass('sorted ascending');
      this.stopped = false;
      this.$('.icon-loading-spinner').css('display', 'inline-block');
      this.$('.stop.btn').show();
      this.$('.count').text('');
      this.$('.results ul').empty();
      this.$('form *:not(.stop)').prop('disabled', true);

      this.ajax( 'requestRules', this.generateUrl() );
      return false;
    },

    stopSearch: function() {
      this.stopped = true;
    },

    finishSearch: function() {
      this.$('form *').prop('disabled', false);
      this.$('.stop.btn').hide();
      this.stopped = true;
      this.$('.icon-loading-spinner').hide();
    },

    filterResults: function(data) {
      var type = this.$('.rules a').closest('li.active').data('type') + 's';
      var results = data[type];

      // Pass results through each selected filter
      _.each(this.$('.query'), function(query) {
        if ( this.$(query).val() ) {
          var filterType = this.$(query).closest('tr').data('filter');
          results = this.filterBy[filterType](results);
        }
      }.bind(this) );

      // Remove times from dates
      _.each(results, function(macro) {
        macro.created_at = macro.created_at.substring(0,10);
        macro.updated_at = macro.updated_at.substring(0,10);
      });

      this.displayResults(results, type);

      // Get additional pages of api request results
      if (data.next_page && !this.stopped){
        this.ajax('requestRules', data.next_page);
      } else {
        this.finishSearch();
      }
    },

    displayResults: function (results, type) {
      var resultsTemplate = this.renderTemplate('results', {results: results, type: type} );
      this.$('.results tbody').append(resultsTemplate);

      // Display result count
      this.$('.count').html("Displaying " + this.$('.results tbody tr').length + " results");
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

    beforeSort: function(event) {
      this.$('.icon-loading-spinner').css('display', 'inline-block');
      var $th = this.$(event.target);
      $th.addClass('sorted');
      $th.siblings().removeClass('sorted ascending');
      $th.toggleClass('ascending');
    },

    filterBy: {
      title: function(items) {
        var query = this.getStringQuery('title');
        return _.filter(items, function(item) {
          return item.title.match(query);
        });
      },

      tag: function(items) {
        var query = this.getStringQuery('tag');
        var results = _.filter(items, function(item) {
          // Filter out tags which don't match query
          var tags = _.filter(this.getTagValues(item), function(tag) {
            return tag.match(query);
          });
          if ( tags.length > 0 ) return item;
        }.bind(this) );

        return results;
      },

      comment: function(items) {
        var query = this.getStringQuery('comment');
        var results = _.filter(items, function(item) {
          // Filter out comments which don't match query
          var comments = _.filter(this.getComments(item), function(comment) {
            return comment.match(query);
          });
          if ( comments.length > 0 ) return item;
        }.bind(this) );

        return results;
      },

      note: function(triggers) {
        var query = this.getStringQuery('note');
        var results = _.filter(triggers, function(trigger) {
          // Filter out notifications which don't match query
          var notifications = _.filter(this.getNotifications(trigger), function(notification) {
            return notification.match(query);
          });
          if ( notifications.length > 0 ) return trigger;
        }.bind(this) );

        return results;
      },

      updated: function(items) {
        var startDate = this.getStartDateQuery('updated');
        var endDate = this.getEndDateQuery('updated');
        var results = _.filter(items, function(item) {
          var updatedDate = new Date(item.updated_at);
          if ( updatedDate > startDate && updatedDate < endDate) {
            return item;
          }
        });

        return results;
      },

      created: function(items) {
        var startDate = this.getStartDateQuery('created');
        var endDate = this.getEndDateQuery('created');
        var results = _.filter(items, function(item) {
          var createdDate = new Date(item.created_at);
          if ( createdDate > startDate && createdDate < endDate) {
            return item;
          }
        });

        return results;
      },

      getTagValues: function(item) {
        var tagActions = _.filter(item.actions, function(action) {
          return action.field.indexOf('_tags') > -1 ||
                 action.field.indexOf('custom_fields_') > -1;
        });
        var values = _.pluck(tagActions, 'value');
        // Remove null values
        return _.reject(values, function(value) { return !value; });
      },

      getComments: function(macro) {
        var actions = _.filter(macro.actions, function(action) {
          return action.value && action.field == "comment_value";
        });
        var comments = _.map(actions, function(action) {
          return action.value[1].toLowerCase();
        });
        return comments;
      },

      getNotifications: function(trigger) {
        var actions = _.filter(trigger.actions, function(action) {
          return action.value && action.field.indexOf("notification") > -1;
        });
        var notifications = _.map(actions, function(action) {
          return action.value[action.value.length - 1].toLowerCase();
        });
        return notifications;
      },

      getStringQuery: function(type) {
        var query = this.$('.query.' + type).val();
        var escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        return new RegExp(escapedQuery, 'i');
      }.bind(this),

      getStartDateQuery: function(type) {
        return new Date( this.$('.query.' + type + '.start-date').val().toLowerCase() );
      }.bind(this),

      getEndDateQuery: function(type) {
        return new Date( this.$('.query.' + type + '.end-date').val().toLowerCase() );
      }.bind(this),
    },

    renderSearchForm: function(searchType) {
      var searchOptions = this.renderTemplate('search-form-' + searchType);
      return this.renderTemplate('search-form-template', {searchOptions: searchOptions, searchType: searchType} );
    },
  };

}());
