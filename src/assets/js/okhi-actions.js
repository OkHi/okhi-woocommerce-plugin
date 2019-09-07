var okhiLocationCardContainerElement = document.getElementById('selected-location-card');
var okhiRequiredAddressField = document.getElementById('billing_address_1');
var okhiDeliveryLocationButton = document.getElementById('lets-okhi');
var okhiBillingPhoneField = document.getElementById('billing_phone');
var okhiBillingLastName = document.getElementById('billing_last_name');
var okhiBillingFirstName = document.getElementById('billing_first_name');
var okhiBillingOkHiLocationData = document.getElementById('billing_okhi_location_data');
var okhiBillingOkHiId = document.getElementById('billing_okhi_id');
var okhiBillingOkHiURL = document.getElementById('billing_okhi_url');
var okhiBillingPostcode = document.getElementById('billing_postcode');
var okhiBillingOtherInformation = document.getElementById('order_comments');
var errorElement = document.getElementById('okhi-errors');
var okhiLocationCard;

var okhiCopy = {
  updateOtherInformation: 'Change your delivery notes',
  createLocation: 'Create a delivery location',
  selectLocation: 'Select a delivery location',
  upsellMessage: 'Create your first delivery location with OkHi!',
  createOtherInformation: 'Delivery notes'
};

// create OkHi User object
// create OkHi User object
var okhiUser = {
  firstName: okhiBillingFirstName ? okhiBillingFirstName.value : '',
  lastName: okhiBillingLastName ? okhiBillingLastName.value : '',
  phone: okhiBillingPhoneField ? okhiBillingPhoneField.value : '',
};

/***
 * common functions
 ***/

 /**
  * reset fields set by OkHi
  */
var okhiResetFields = function () {
  var fields = [
    okhiRequiredAddressField,
    okhiBillingOkHiLocationData,
    okhiBillingOkHiId,
    okhiBillingOkHiURL,
    okhiBillingPostcode,
    okhiBillingOtherInformation,
  ];
  for (var index = 0; index < fields.length; index++) {
    var element = fields[index];
    element.value = '';
  }
}

/**
 * event handler with compat setup
 * @param {*} obj 
 * @param {*} type 
 * @param {*} fn 
 */
var okhiAddEvent = function (obj, type, fn) {

  if (obj.addEventListener) {
    obj.addEventListener(type, fn, false);
  }
  else if (obj.attachEvent) {
    obj["e" + type + fn] = fn;
    obj[type + fn] = function () { obj["e" + type + fn](window.event); }
    obj.attachEvent("on" + type, obj[type + fn]);
  }
  else {
    obj["on" + type] = obj["e" + type + fn];
  }
}

/**
 * Show user's selected location
 * @param {Object} user - current user
 * @param {Object} containerElement - parent container element
 * @param {function} onSuccess
 * @param {function} onError 
 * @param {Object} currentLocationObject
 */
var okhiRenderLocationCard = function (
  user,
  containerElement,
  onSuccess = okhiHandleOnSuccess,
  onError = okhiHandleOnError,
  currentLocationObject
) {

  // empty the container element
  // containerElement.innerHTML = '';

  if (!user.phone) {
    return okhiHandleOnError(new Error('Enter a phone number to continue'));
  }
  containerElement.style.display = 'block';
  return new okhi.LocationCard({
    element: containerElement,
    user: user,
    onSuccess: onSuccess,
    onError: onError,
    style: okhi_widget_styles,
    location: currentLocationObject,
    copy: okhiCopy,
    config: okhi_config,
  });
}

/**
 * Handle data received from OkHi
 * @param {Object} data 
 * @param {function} isCallBackCard 
 */
var okhiHandleOnSuccess = function (data) {
  // handle your success here with the data you get back
  if (!data || !data.location) {
    return
  }

  if (typeof locationRawData !== 'undefined') {
    locationRawData.value = JSON.stringify(data.location);
  }

  var addressTextData = [];
  if (data.location.propertyName) {
    addressTextData.push(data.location.propertyName);
  }
  if (data.location.directions) {
    addressTextData.push(data.location.directions);
  }
  if (data.location.streetName) {
    addressTextData.push(data.location.streetName);
  }
  if (typeof okhiRequiredAddressField !== 'undefined') {
    okhiRequiredAddressField.value = addressTextData.join(', ').trim();
  }
  if (typeof okhiBillingOtherInformation !== 'undefined') {
    okhiBillingOtherInformation.value = data.location.otherInformation || '';
  }
  if (typeof okhiBillingPostcode !== 'undefined') {
    okhiBillingPostcode.value = data.location.plusCode || '';
  }
  if (typeof okhiBillingOkHiLocationData !== 'undefined') {
    okhiBillingOkHiLocationData.value = JSON.stringify(data.location);
  }
  if (typeof okhiBillingOkHiId !== 'undefined') {
    okhiBillingOkHiId.value = data.location.id || '';
  }
  if (typeof okhiBillingOkHiURL !== 'undefined') {
    okhiBillingOkHiURL.value = data.location.url || '';
  }

  // trigger calculation of shipping costs
  jQuery(document.body).trigger('update_checkout');

  if (!okhiLocationCard) {
    okhiLocationCard = okhiRenderLocationCard(
      data.user,
      okhiLocationCardContainerElement,
      okhiHandleOnSuccess,
      okhiHandleOnError,
      data.location,
    );
    return;
  }
  okhiDeliveryLocationButton.style.display = 'none';
  okhiLocationCardContainerElement.style.display = 'block';
};

/**
 * Handle errors from OkHi
 * @param {Object} error 
 */
var okhiHandleOnError = function (error) {
  if (!errorElement) {
    return;
  }
  if (!error) {
    errorElement.innerHTML = '';
    return;
  }
  // handle errors here e.g fallback to your own way of collecting a location information
  errorElement.innerHTML = error.message ? error.message : 'Something went wrong please try again';
};

/**
 * handle user changing phone number
 * to ensure we always have the right location for the user phone
 * changes to phone would result in re-init of the card
 */

var okhiHandlePhoneChange = function () {
  if (!okhiLocationCard) {
    // no location card so do nothing
    return;
  }

  if (okhiUser.phone === okhiBillingPhoneField.value) {
    return
  }
  if (okhiBillingPhoneField.value) {
    okhiDeliveryLocationButton.style.display = 'none';
    okhiLocationCardContainerElement.style.display = 'block';
  } else {
    okhiLocationCardContainerElement.style.display = 'none';
    okhiDeliveryLocationButton.style.display = 'block';
  }

  okhiUser = {
    firstName: okhiBillingFirstName.value,
    lastName: okhiBillingLastName.value,
    phone: okhiBillingPhoneField.value
  }

  okhiHandleOnError(null);
  okhiResetFields();
  // update current location card
  if (okhiLocationCard) {

    okhiLocationCard.user = okhiUser;
    return;
  }

  okhiLocationCard = okhiRenderLocationCard(
    okhiUser,
    okhiLocationCardContainerElement,
    function (data) {
      okhiHandleOnSuccess(data, true)
    },
    okhiHandleOnError,
  );
}

/**
 * handle delivery location button click
 * to launch location manager
 */

var okhiHandleDeliveryLocationButtonClick = function (e) {
  if (e) {
    e.preventDefault();
  }
  // reset errors
  okhiHandleOnError(null);

  // craete okhi user object
  var firstName = document.getElementById('billing_first_name');
  var lastName = document.getElementById('billing_last_name');
  var phone = document.getElementById('billing_phone');
  if (!phone || !phone.value) {
    return okhiHandleOnError(new Error('Enter a phone number to continue'));
  }

  var user = {
    phone: phone.value,
    firstName: firstName ? firstName.value : '',
    lastName: lastName ? lastName.value : '',
  };

  // instanciate manager
  var locationManager = new okhi.LocationManager({
    user: user,
    onSuccess: function (data) {
      okhiHandleOnSuccess(data);
      okhiDeliveryLocationButton.style.display = 'none';
      okhiLocationCardContainerElement.style.display = 'block';
    },
    onError: okhiHandleOnError,
    style: okhi_widget_styles,
    copy: okhiCopy,
    config: okhi_config,
  });
  var currentLocationObject = null;
  var currentLoctionIdElement = document.getElementById('billing_okhi_id');
  if (currentLoctionIdElement && currentLoctionIdElement.value) {
    currentLocationObject = {
      id: currentLoctionIdElement.value // The OkHi location id you want manipulated in the selected mode
    }
  }
  var launchConfiguration = {
    mode: 'select_location',
    location: currentLocationObject
  };
  locationManager.launch(launchConfiguration);
};
/**
 * listen for changes in the phone field
 */
okhiAddEvent(
  okhiBillingPhoneField,
  'blur',
  okhiHandlePhoneChange);

/**
 * Delivery location button listener
 */
okhiAddEvent(okhiDeliveryLocationButton, 'click', okhiHandleDeliveryLocationButtonClick);

/**
 * show location card for repeat users
 * for a zero click user experience
 */
if (okhiUser.phone) {
  okhiLocationCard = okhiRenderLocationCard(
    okhiUser,
    okhiLocationCardContainerElement,
    function (data) {
      okhiHandleOnSuccess(data, true)
    },
    okhiHandleOnError,
  );
}

/**
 * otherwise show a button to launch OkHi
 * location manager
 */
else {
  okhiDeliveryLocationButton.style.display = 'block'
}