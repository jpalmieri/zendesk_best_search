(function() {

  BASE_URL = '/api/v2/';

  return {
    events: {
      'app.activated':                      'initialize',
      'pane.activated':                     'activate',
      'click .search.btn':                  'startSearch',
      'requestRules.done':                  'filterResults',
      'click .stop.btn':                    'stopSearch',
      'mousedown .results th':              'beforeSort',
      'mouseup .results th':                'sortTable',
      'change select.rules':                'switchSearchTemplate'
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
      this.switchTo('macros-search');
      this.stopped = true;
    },

    activate: function() {
      this.$('.query.date').datepicker({ dateFormat: "yy-mm-dd" });
    },

    switchSearchTemplate: function(event) {
      var $selectedOption = this.$(event.target).find('option:selected');
      this.switchTo( $selectedOption.data('type') + '-search' );
      this.activate();
    },

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

    generateUrl: function() {
      var type = this.$('select.rules').find('option:selected').data('type');
      var onlyActive = !this.$('.check.status').is(':checked');

      var url = BASE_URL + type;
      if (onlyActive) url += '/active';
      url += '.json';

      return url;
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

        this.ajax( 'requestRules', this.generateUrl() );
      }
      return false;
    },

    stopSearch: function() {
      this.stopped = true;
    },

    finishSearch: function() {
      this.$('.search.btn').prop('disabled', false);
      this.$('.query').prop('disabled', false);
      this.$('.stop.btn').hide();
      this.stopped = true;
      this.$('.icon-loading-spinner').hide();
    },

    filterResults: function(data) {
      var type = this.$('select.rules').find('option:selected').data('type');
      var results = data[type];

      if ( this.$('.check.tag').is(':checked') ) {
        var query = this.$('.query.tag').val().toLowerCase();
        results = this.filter.byTag(results, query);
      }
      if ( this.$('.check.comment').is(':checked') ) {
        var query = this.$('.query.comment').val().toLowerCase();
        results = this.filter.byComment(results, query);
      }
      if ( this.$('.check.note').is(':checked') ) {
        var query = this.$('.query.note').val().toLowerCase();
        results = this.filter.byNotification(results, query);
      }
      if ( this.$('.check.created').is(':checked') ) {
        var startDate = new Date( this.$('.query.created.start-date').val() );
        var endDate = new Date( this.$('.query.created.end-date').val() );
        results = this.filter.byCreatedDate(results, startDate, endDate);
      }
      if ( this.$('.check.updated').is(':checked') ) {
        var startDate = new Date( this.$('.query.updated.start-date').val() );
        var endDate = new Date( this.$('.query.updated.end-date').val() );
        results = this.filter.byUpdatedDate(results, startDate, endDate);
      }

      // Remove times from dates
      _.each(results, function(macro) {
        macro.created_at = macro.created_at.substring(0,10);
        macro.updated_at = macro.updated_at.substring(0,10);
      });

      this.displayResults(results);

      // Get additional pages of api request results
      if (data.next_page && !this.stopped){
        this.ajax('requestRules', data.next_page);
      } else {
        this.finishSearch();
      }
    },


    filter: {

      byTag: function(items, query) {
        var results = _.filter(items, function(item) {
          // Filter out tags which don't match query
          var tags = _.filter(this._getValues(item), function(tag) {
            return tag.indexOf(query) > -1;
          });
          if ( tags.length > 0 ) return item;
        }.bind(this) );

        return results;
      },

      byComment: function(items, query) {
        var results = _.filter(items, function(item) {
          // Filter out comments which don't match query
          var comments = _.filter(this._getComments(item), function(comment) {
            return comment.indexOf(query) > -1;
          });
          if ( comments.length > 0 ) return item;
        }.bind(this) );

        return results;
      },

      byNotification: function(triggers, query) {
        var results = _.filter(triggers, function(trigger) {
          // Filter out notifications which don't match query
          var notifications = _.filter(this._getNotifications(trigger), function(notification) {
            return notification.indexOf(query) > -1;
          });
          if ( notifications.length > 0 ) return trigger;
        }.bind(this) );

        return results;
      },

      byUpdatedDate: function(items, startDate, endDate) {
        var results = _.filter(items, function(item) {
          var updatedDate = new Date(item.updated_at);
          if ( updatedDate > startDate && updatedDate < endDate) {
            return item;
          }
        });

        return results;
      },

      byCreatedDate: function(items, startDate, endDate) {
        var results = _.filter(items, function(item) {
          var createdDate = new Date(item.created_at);
          if ( createdDate > startDate && createdDate < endDate) {
            return item;
          }
        });

        return results;
      },

      _getValues: function(macro) {
        var values = _.pluck(macro.actions, 'value');
        // Remove null values
        return _.reject(values, function(value) { return !value; });
      },

      _getComments: function(macro) {
        var actions = _.filter(macro.actions, function(action) {
          return action.value && action.field == "comment_value";
        });
        var comments = _.map(actions, function(action) {
          return action.value[1].toLowerCase();
        });
        return comments;
      },

      _getNotifications: function(trigger) {
        var actions = _.filter(trigger.actions, function(action) {
          return action.value && action.field.indexOf("notification") > -1;
        });
        var notifications = _.map(actions, function(action) {
          return action.value[action.value.length - 1].toLowerCase();
        });
        return notifications;
      }
    },

    displayResults: function (results) {
      // Render the template
      var resultsTemplate = this.renderTemplate('results', {results: results} );

      // Insert rendered template into the results div
      this.$('.results tbody').append(resultsTemplate);

      // Display result count
      this.$('.count').html("Displaying " + this.$('.results tbody tr').length + " results");

    },
  };

}());
