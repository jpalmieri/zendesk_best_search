(function() {

  var API_PATH = '/api/v2';
  var ENDPOINT_PATH = {
    macro: '/macros/active.json',
    trigger: '/triggers/active.json',
    automation: '/automations/active.json',
    view: '/views/active.json',
    dynamicContent: '/dynamic_content/items.json',
    article: '/help_center/%@/articles.json'
  };
  var NEW_ITEM_PATH = {
    macro: '/rules/new?filter=macro',
    trigger: '/rules/new?filter=trigger',
    automation: '/rules/new?filter=automation',
    view: '/rules/new?filter=view',
    dynamicContent: '/dynamic_content/items/new'
  };

  return {
    events: {
      'app.activated':                      'initialize',
      'pane.activated':                     'activate',
      'click .search.btn':                  'startSearch',
      'requestItems.done':                  'processResults',
      'getlocales.done':                    'processLocales',
      'click .stop.btn':                    'stopSearch',
      'mousedown .results th':              'beforeSort',
      'mouseup .results th':                'sortTable',
      'click .search-types a':              'switchSearchTemplate',
      'change .query':                      'handleChangedQuery',
      'keyup .query':                       'handleChangedQuery',
      'click .query-clear':                 'clearQuery'
    },

    requests: {
      // General request which returns items to be searched
      requestItems: function(url) {
        return {
          url:       url,
          type:     'GET',
          dataType: 'json'
        };
      },
      // Locales are used for returning articles (they're interpolated in the 'article' url)
      getlocales: function() {
        return {
          url: '/api/v2/locales.json',
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    initialize: function() {
      this.ajax('getlocales');
      this.stopped = true;
      this.initialized = true;
    },

    activate: function() {
      if (this.initialized) {
        // Load template associated with tab that has .active by default in html
        this.$('.search-types .active a').trigger('click');
        this.initialized = false;
      }
    },

    processLocales: function(data) {
      // Move default locale to first in list (for select list on form)
      var sortedLocales = _.sortBy(data.locales, function(locale) {
        return !locale.default;
      });
      this.locales = sortedLocales;
    },

    switchSearchTemplate: function(event) {
      var $selectedOption = this.$(event.target).closest('li');
      var searchType = $selectedOption.data('type');
      var searchFormHtml = this.renderSearchForm(searchType);
      this.$('section[data-main]').html(searchFormHtml);
      // Add jQuery datepicker to date fields
      this.$('.query.date').datepicker({dateFormat: "yy-mm-dd"});
      // UI: Make current tab highlighted (and only current tab)
      $selectedOption.addClass('active').siblings().removeClass('active');
    },

    renderSearchForm: function(searchType) {
      var searchFields = this.renderTemplate('search-form-' + searchType, {locales: this.locales});
      var newItemPath = NEW_ITEM_PATH[searchType];
      var searchFormType = {};
      searchFormType[searchType] = true;
      if (searchType != 'dynamicContent' && searchType != 'article') {
        searchFormType['other'] = true;
      }
      var templateData = {
        searchFields: searchFields,
        searchType:   searchType,
        newItemPath:  newItemPath,
        searchFormType: searchFormType
      };
      return this.renderTemplate('search-form-template', templateData);
    },

    // Enable/disable elements when fields' values change
    handleChangedQuery: function(event) {
      this.toggleSearchBtn();

      // Show 'x' to clear input
      if ( this.$(event.target).val() ) {
        this.$(event.target).siblings('.query-clear').show();
      } else {
        this.$(event.target).siblings('.query-clear').hide();
      }
    },

    // Only show seach button when a field has value
    // to avoid being able to search without a query
    toggleSearchBtn: function() {
      var atLeastOneQueryHasText = _.some(this.$('.query'), function(queryInput) {
        return this.$(queryInput).val();
      }.bind(this) );
      if (atLeastOneQueryHasText) {
        this.$('.search.btn').prop('disabled', false);
      } else {
        this.$('.search.btn').prop('disabled', true);
      }
    },

    // Clear field value when 'x' is clicked
    clearQuery: function(event) {
      this.$(event.target).siblings('.query').val('').select();
      this.toggleSearchBtn();
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

      this.ajax( 'requestItems', this.buildApiUrl() );
      // Avoid actual form submission, which redirects to new page
      return false;
    },

    buildApiUrl: function() {
      var searchType = this.$('.search-types a').closest('li.active').data('type');
      var includeInactive = this.$('.check.status').is(':checked');
      var apiUrl = API_PATH + ENDPOINT_PATH[searchType];

      // Include locale in resource url if searcing articles
      var locale = '';
      if (searchType == 'article') {
        locale = this.$('select.locale').find(':selected').attr('value').toLowerCase();
        apiUrl = API_PATH + helpers.fmt(ENDPOINT_PATH['article'], locale);
      }

      // Use a different endpoint if returning inactive items,
      // except for dynamic content and articles, which doesn't have this endpoint
      if (includeInactive && searchType != 'dynamicContent' && searchType != 'article') {
        apiUrl = apiUrl.replace('/active', '');
      }
      return apiUrl;
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

    processResults: function(data) {
      var itemType = this.$('.search-types a').closest('li.active').data('item');
      var results = data[itemType];

      // Pass results through each selected filter
      _.each(this.$('.query'), function(query) {
        if ( this.$(query).val() ) {
          var filterType = this.$(query).closest('tr').data('filter');
          results = this.filterBy[filterType](results);
        }
      }.bind(this) );

      // Remove times from dates
      _.each(results, function(item) {
        item.created_at = item.created_at.substring(0,10);
        item.updated_at = item.updated_at.substring(0,10);
      });

      // Return 'active' if at least one Dynamic Content
      // variant (other than the default) is active
      var searchType = this.$('.search-types a').closest('li.active').data('type');
      if (searchType == 'dynamicContent') {
        _.each(results, function(item){
          var variantIsActive = _.some(item.variants, function(variant){
            return variant.active && !variant.default;
          });
          if (variantIsActive) item.active = true;
        });
      }

      // Filter out drafts for articles unless checkbox is checked
      var excludeDrafts = !this.$('.check.status').is(':checked');
      if (searchType == 'article' && excludeDrafts) {
        results = _.reject(results, function(article){
          return article.draft === true;
        });
      }

      this.displayResults(results, itemType);

      // Get additional pages of api request results
      if (data.next_page && !this.stopped){
        this.ajax('requestItems', data.next_page);
      } else {
        this.finishSearch();
      }
    },

    displayResults: function (results) {
      var searchType = this.$('.search-types a').closest('li.active').data('type');
      var searchFormType = {};
      searchFormType[searchType] = true;
      if (searchType != 'dynamicContent' && searchType != 'macro' && searchType != 'article') {
        searchFormType['other'] = true;
      }
      var options = {
        results:    results,
        type:       searchType,
        searchFormType: searchFormType
      };
      var resultsTemplate = this.renderTemplate('results', options);
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

    // Display spinner while sorting results table
    beforeSort: function(event) {
      this.$('.icon-loading-spinner').css('display', 'inline-block');
      var $th = this.$(event.target);
      $th.addClass('sorted');
      $th.siblings().removeClass('sorted ascending');
      $th.toggleClass('ascending');
    },

    // This object includes filter functions which process items
    // from API response, returning only items which match given query.
    // Used in conjunction: e.g., matches (title && name), not (title || name)
    filterBy: {
      title: function(items) {
        var query = this.getStringQuery('title');
        return _.filter(items, function(item) {
          return item.title.match(query);
        });
      },

      body: function(items) {
        var query = this.getStringQuery('body');
        return _.filter(items, function(item) {
          return item.body.match(query);
        });
      },

      name: function(dcItems) {
        var query = this.getStringQuery('name');
        return _.filter(dcItems, function(item) {
          return item.name.match(query);
        });
      },

      placeholder: function(dcItems) {
        var query = this.getStringQuery('placeholder');
        return _.filter(dcItems, function(item) {
          return item.placeholder.match(query);
        });
      },

      tag: function(items) {
        var query = this.getStringQuery('tag');
        var results = _.filter(items, function(item) {
          // Filter out tags which don't match query
          var tags = _.filter(this.getTagValues(item), function(tag) {
            return tag.match(query);
          });
          if (tags.length > 0) return item;
        }.bind(this) );

        return results;
      },

      comment: function(macros) {
        var query = this.getStringQuery('comment');
        var results = _.filter(macros, function(item) {
          // Filter out comments which don't match query
          var comments = _.filter(this.getComments(item), function(comment) {
            return comment.match(query);
          });
          if (comments.length > 0) return item;
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
          if (notifications.length > 0) return trigger;
        }.bind(this) );

        return results;
      },

      content: function(dcItems) {
        var query = this.getStringQuery('content');
        var results = _.filter(dcItems, function(dcItem) {
          // Filter out contents which don't match query
          var contents = _.filter(this.getContents(dcItem), function(content) {
            return content.match(query);
          });
          if (contents.length > 0) return dcItem;
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

      // The 'get' functions below are functions
      // which assist the filter functions above.
      // They are only used within the scope of this object (filterBy).
      getTagValues: function(item) {
        var tagActions = _.filter(item.actions, function(action) {
          return action.field.indexOf('_tags') > -1 ||
                 action.field.indexOf('custom_fields_') > -1;
        });
        var values = _.pluck(tagActions, 'value');
        // Remove null values
        return _.reject(values, function(value) {return !value;});
      },

      getComments: function(macro) {
        var actions = _.filter(macro.actions, function(action) {
          return action.value && (["comment_value", "comment_value_html"].includes(action.field));
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

      getContents: function(dcItem) {
        // Filter out variants without content
        var variants = _.filter(dcItem.variants, function(variant) {
          return variant.content;
        });
        var contents = _.map(variants, function(variant) {
          return variant.content.toLowerCase();
        });
        return contents;
      },

      getStringQuery: function(queryType) {
        var query = this.$('.query.' + queryType).val();
        var escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        return new RegExp(escapedQuery, 'i');
      }.bind(this),

      getStartDateQuery: function(queryType) {
        return new Date( this.$('.query.' + queryType + '.start-date').val().toLowerCase() );
      }.bind(this),

      getEndDateQuery: function(queryType) {
        return new Date( this.$('.query.' + queryType + '.end-date').val().toLowerCase() );
      }.bind(this)
    }
  };
}());
