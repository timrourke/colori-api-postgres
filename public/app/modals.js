// -------------------------------------------------- //
// -------------------------------------------------- //
// Credit: Ben Nadel's simple Angular modals: http://bennadel.github.io/JavaScript-Demos/demos/managing-modals-angularjs/

// I control the Alert modal window.
// --
// NOTE: This controller gets "modals" injected; but, it is in no way 
// different than any other Controller in your entire AngularJS application. 
// It takes services, manages the view-model, and knows NOTHING about the DOM.
app.controller("AlertModalController", ['$scope', 'modals', function( $scope, modals ) {

	// Setup default values using modal params.
	$scope.message = ( modals.params().message || "Whoa!" );

	
	// ---
	// PUBLIC METHODS.
	// ---


	// Wire the modal buttons into modal resolution actions.
	$scope.close = modals.resolve;


	// I jump from the current alert-modal to the confirm-modal.
	$scope.jumpToConfirm = function() {

		// We could have used the .open() method to jump from one modal 
		// to the next; however, that would have implicitly "rejected" the
		// current modal. By using .proceedTo(), we open the next window, but
		// defer the resolution of the current modal until the subsequent 
		// modal is resolved or rejected.
		modals.proceedTo( 
			"confirm",
			{
				message: "I just came from Alert - doesn't that blow your mind?",
				confirmButton: "Eh, maybe a little",
				denyButton: "Oh please"
			}
		)
		.then(
			function handleResolve() {

				console.log( "Piped confirm resolved." );

			},
			function handleReject() {

				console.warn( "Piped confirm rejected." );

			}
		);

	};

}]);


// -------------------------------------------------- //
// -------------------------------------------------- //


// I control the Confirm modal window.
// --
// NOTE: This controller gets "modals" injected; but, it is in no way 
// different than any other Controller in your entire AngularJS application. 
// It takes services, manages the view-model, and knows NOTHING about the DOM.
app.controller("ConfirmModalController", ['$scope', 'modals', function( $scope, modals ) {

	var params = modals.params();

	// Setup defaults using the modal params.
	$scope.message = ( params.message || "Are you sure?" );
	$scope.confirmButton = ( params.confirmButton || "Yes!" );
	$scope.denyButton = ( params.denyButton || "Oh, hell no!" );


	// ---
	// PUBLIC METHODS.
	// ---


	// Wire the modal buttons into modal resolution actions.
	$scope.confirm = modals.resolve;
	$scope.deny = modals.reject;
		
}]);


// -------------------------------------------------- //
// -------------------------------------------------- //


// I control the Prompt modal window.
// --
// NOTE: This controller gets "modals" injected; but, it is in no way 
// different than any other Controller in your entire AngularJS application. 
// It takes services, manages the view-model, and knows NOTHING about the DOM.
app.controller("PromptModalController", ['$scope', 'modals', function( $scope, modals ) {

	// Setup defaults using the modal params.
	$scope.message = ( modals.params().message || "Give me." );

	// Setup the form inputs (using modal params).
	$scope.form = {
		input: ( modals.params().placeholder || "" )
	};
	
	$scope.errorMessage = null;


	// ---
	// PUBLIC METHODS.
	// ---


	// Wire the modal buttons into modal resolution actions.
	$scope.cancel = modals.reject;


	// I process the form submission.
	$scope.submit = function() {

		// If no input was provided, show the user an error message.
		if ( ! $scope.form.input ) {

			return( $scope.errorMessage = "Please provide something!" );

		}

		modals.resolve( $scope.form.input );

	};

}]);


// -------------------------------------------------- //
// -------------------------------------------------- //


// I manage the modals within the application.
app.service("modals", ['$rootScope', '$q', function( $rootScope, $q ) {

	// I represent the currently active modal window instance.
	var modal = {
		deferred: null,
		params: null
	};
	
	// Return the public API.
	return({
		open: open,
		params: params,
		proceedTo: proceedTo,
		reject: reject,
		resolve: resolve
	});


	// ---
	// PULBIC METHODS.s
	// ---


	// I open a modal of the given type, with the given params. If a modal 
	// window is already open, you can optionally pipe the response of the
	// new modal window into the response of the current (cum previous) modal
	// window. Otherwise, the current modal will be rejected before the new
	// modal window is opened.
	function open( type, params, pipeResponse ) {

		var previousDeferred = modal.deferred;

		// Setup the new modal instance properties.
		modal.deferred = $q.defer();
		modal.params = params;

		// We're going to pipe the new window response into the previous 
		// window's deferred value.
		if ( previousDeferred && pipeResponse ) {

			modal.deferred.promise
				.then( previousDeferred.resolve, previousDeferred.reject )
			;

		// We're not going to pipe, so immediately reject the current window.
		} else if ( previousDeferred ) {

			previousDeferred.reject();

		}

		// Since the service object doesn't (and shouldn't) have any direct
		// reference to the DOM, we are going to use events to communicate 
		// with a directive that will help manage the DOM elements that 
		// render the modal windows.
		// --
		// NOTE: We could have accomplished this with a $watch() binding in
		// the directive; but, that would have been a poor choice since it
		// would require a chronic watching of acute application events.
		$rootScope.$emit( "modals.open", type );

		return( modal.deferred.promise );

	}


	// I return the params associated with the current params.
	function params() {

		return( modal.params || {} );

	}


	// I open a modal window with the given type and pipe the new window's
	// response into the current window's response without rejecting it 
	// outright.
	// --
	// This is just a convenience method for .open() that enables the 
	// pipeResponse flag; it helps to make the workflow more intuitive. 
	function proceedTo( type, params ) {

		return( open( type, params, true ) );

	}


	// I reject the current modal with the given reason.
	function reject( reason ) {

		if ( ! modal.deferred ) {

			return;

		}

		modal.deferred.reject( reason );

		modal.deferred = modal.params = null;

		// Tell the modal directive to close the active modal window.
		$rootScope.$emit( "modals.close" );

	}


	// I resolve the current modal with the given response.
	function resolve( response ) {

		if ( ! modal.deferred ) {

			return;

		}					

		modal.deferred.resolve( response );

		modal.deferred = modal.params = null;

		// Tell the modal directive to close the active modal window.
		$rootScope.$emit( "modals.close" );

	}

}]);


// I manage the views that are required to render the modal windows. I don't
// actually define the modals in anyway - I simply decide which DOM sub-tree
// should be linked. The means by which the modal window is defined is 
// entirely up to the developer.
app.directive("bnModals", ['$rootScope', 'modals', function( $rootScope, modals ) {

	// Return the directive configuration.
	return( link );


	// I bind the JavaScript events to the scope.
	function link( scope, element, attributes ) {

		// I define which modal window is being rendered. By convention, 
		// the subview will be the same as the type emitted by the modals
		// service object.
		scope.subview = null;

		// If the user clicks directly on the backdrop (ie, the modals 
		// container), consider that an escape out of the modal, and reject
		// it implicitly.
		element.on(
			"click",
			function handleClickEvent( event ) {

				if ( element[ 0 ] !== event.target ) {

					return;

				}
				
				scope.$apply( modals.reject );

			}
		);

		// Listen for "open" events emitted by the modals service object.
		$rootScope.$on(
			"modals.open",
			function handleModalOpenEvent( event, modalType ) {

				scope.subview = modalType;

			}
		);

		// Listen for "close" events emitted by the modals service object.
		$rootScope.$on(
			"modals.close",
			function handleModalCloseEvent( event ) {

				scope.subview = null;

			}
		);

	}

}]);