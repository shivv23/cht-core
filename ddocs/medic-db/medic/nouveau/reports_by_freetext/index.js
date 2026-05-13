function(doc) {
  var skip = ['_id', '_rev', 'type', 'refid', 'content'];

  var normalizeNumerals = function(str) {
    return str.replace(/[०-९٠-٩۰-۹]/g, function(d) {
      var cc = d.charCodeAt(0);
      if (cc >= 0x0966 && cc <= 0x096F) return String.fromCharCode(cc - 0x0966 + 0x0030);
      if (cc >= 0x06F0 && cc <= 0x06F9) return String.fromCharCode(cc - 0x06F0 + 0x0030);
      return String.fromCharCode(cc - 0x0660 + 0x0030);
    });
  };

  var indexMaybe = function(type, fieldName, value, opts) {
    if(String(value).length < 3) { // Too short
      return;
    }
    index(type, fieldName, value, opts);
  };

  var indexField = function(key, value) {
    if (!key || !value) {
      return;
    }
    var lowerKey = key.toLowerCase();
    if (skip.indexOf(lowerKey) !== -1 || /_date$/.test(lowerKey)) {
      return;
    }

    if (typeof value === 'string') {
      var lowerValue = normalizeNumerals(value.toLowerCase());
      indexMaybe('text', 'default', lowerValue);
      indexMaybe('string', 'exact_match', lowerKey + ':' + lowerValue);
    } else if (typeof value === 'number') {
      indexMaybe('string', 'exact_match', lowerKey + ':' + value);
    }
  };

  if (doc.type !== 'data_record' || !doc.form) {
    return;
  }

  Object.keys(doc).forEach(function(key) {
    indexField(key, doc[key]);
  });
  if (doc.fields) {
    Object.keys(doc.fields).forEach(function(key) {
      indexField(key, doc.fields[key]);
    });
  }
  if (doc.contact && doc.contact._id && typeof doc.contact._id === 'string') {
    index('string', 'exact_match', 'contact:' + doc.contact._id.toLowerCase());
  }
  var reportedDate = doc.reported_date && typeof doc.reported_date === 'number' ? doc.reported_date : 0;
  index('double', 'reported_date', reportedDate, { store: true });
}
