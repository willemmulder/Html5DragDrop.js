// HTML5DragDrop will not add HTML tags, nor styling. You have full control.
$.fn.html5dragdrop = function(options) {

	// If no arguments are set, check if html5dragdrop has in the past already been set and return that instance
	if (!options && this.size() === 1 && this.first().data("jquery-html5dragdrop")) {
		return this.first().data("jquery-html5dragdrop");
	}

	var defaultOptions = {
		draggables : "li",
		acceptDraggableFromElsewhere : false,
		ghosting : true,
		droppables : "ul",
		onDragStart : function(draggedElement, details) {

		},
		onDragCancelled : function(draggedElement, details) {

		},
		onDrop : function(draggedElement, destinationDroppable, details) {

		},
		/*
		onDrag : function(draggedElement, details) {

		}, */
		// onEnterDroppable on the next droppable is fired *before* the onLeaveDroppable of the previous droppable
		onEnterDroppable : function(draggedElement,  enteredDroppable, details) {

		},
		/*
		onHoverDroppable : function(draggedElement, hoveredDroppable, details) {

		}, */
		onLeaveDroppable : function(draggedElement, leftDroppable, details) {

		},
		/*
		// onEnterElementInDroppable on the next element is fired *before* the onLeaveElementInDroppable of the previous elm
		onEnterElementInDroppable : function(draggedElement,  enteredElement, details) {

		},
		// onEnterElementInDroppable on the next element is fired *before* the onLeaveElementInDroppable of the previous elm
		onLeaveElementInDroppable : function(draggedElement,  leftElement, details) {

		},*/
		getGhostingContent : function(draggedElement, details) {
			return draggedElement;
		}
	};
	options = $.extend(defaultOptions, options);
	var elements = this;
	var returnFunctions;

	// - Set html5dragdrop on all elements
	elements.each(function() {
		
		// --- Variables
		var root = $(this);
		var draggables = root.find(options.draggables);
		var droppables = root.find(options.droppables);
		var currentlyDraggedElement = null;
		var currentlyHoveredElement = null;
		var currentlyHoveredDroppable = null;
		var elementWasDroppedSuccessfully = false;

		// --- Create event nameSpace
		var randomEventNamespace = ".jQuery-html5DragDrop-" + new Date().getTime() + "-" + Math.random();

		// --- Initialize draggables and droppables
		initDraggables(draggables);

		$(document).on("dragenter"+randomEventNamespace, function(event) {
			// If we get here, the dragenter has not been stopPropagated() by any droppable, 
			// so we are now *outside* a droppable
			currentlyHoveredElement = $(event.target);
			// If currentlyHoveredDroppable is filled, this is the first dragenter event outisde the droppable
			if(currentlyHoveredDroppable !== null) {
				currentlyHoveredDroppable = null;
			}
		});

		initDroppables(droppables);

		// --- Support functions

		function initDraggables(draggablesToInit) {
			draggablesToInit = draggablesToInit || draggables;			
			draggablesToInit.each(function() {
				this.draggable = true;
				$(this).on("dragstart"+randomEventNamespace, function(event) {
					currentlyDraggedElement = $(event.target);
					currentlyHoveredElement = $(event.target);
					options.onDragStart(currentlyDraggedElement, { 
						mouseLocation: getMouseLocation(event, currentlyDraggedElement, null)
					});
					// Set the ghosting image
					if (!options.ghosting) {
						event.originalEvent.dataTransfer.setDragImage($("<div/>").get(0), 0, 0);
					} else {
						var ghosting = options.getGhostingContent(currentlyDraggedElement);
						if (ghosting instanceof jQuery) {
							ghosting = ghosting.get(0);
						}
						if (ghosting instanceof Element) {
							event.originalEvent.dataTransfer.setDragImage(ghosting, 0, 0);
						}
					}
					event.stopPropagation();
				});
				$(this).on("drag"+randomEventNamespace, function(event) {
					if (options.onDrag) {
						options.onDrag(currentlyDraggedElement, { 
							mouseLocation: getMouseLocation(event, currentlyDraggedElement, currentlyHoveredDroppable, currentlyHoveredElement),
							currentlyHoveredElement : currentlyHoveredElement
						});
					}
					event.stopPropagation();
				});
				$(this).on("dragend"+randomEventNamespace, function(event) {
					// Trigger a 'leave' on the currentlyHoveredElement and currentlyHoveredDroppable
					if (currentlyHoveredDroppable && currentlyHoveredElement) {
						options.onLeaveDroppable(currentlyDraggedElement, currentlyHoveredDroppable, { 
							mouseLocation: getMouseLocation(event, currentlyDraggedElement, currentlyHoveredDroppable, currentlyHoveredElement),
							currentlyHoveredElement : currentlyHoveredElement
						});
					}	
					// Trigger a cancel or a drop, based on whether the elementWasDroppedSuccessfully
					if (elementWasDroppedSuccessfully) {
						options.onDrop(currentlyDraggedElement, currentlyHoveredDroppable, { 
							mouseLocation: getMouseLocation(event, currentlyDraggedElement, currentlyHoveredDroppable, currentlyHoveredElement),
							currentlyHoveredElement : currentlyHoveredElement
						});
					} else {
						options.onDragCancelled(currentlyDraggedElement, { 
							mouseLocation: getMouseLocation(event, currentlyDraggedElement, null)
						});
					}
					// Reset variables
					currentlyDraggedElement = null;
					currentlyHoveredDroppable = null;
					currentlyHoveredElement = null;
					elementWasDroppedSuccessfully = false;
					event.preventDefault();
					event.stopPropagation();
				});
			});
		}

		function initDroppables(droppablesToInit) {
			droppablesToInit = droppablesToInit || droppables;
			droppablesToInit.each(function() {
				$(this).on("dragover"+randomEventNamespace, function(event) {
					// .PreventDefault() is a means of saying that we accept the draggable
					event.preventDefault();
					event.stopPropagation();
					currentlyHoveredDroppable = $(event.originalEvent.currentTarget);
					if (options.onHoverDroppable) {
						options.onHoverDroppable(currentlyDraggedElement, currentlyHoveredDroppable, { 
							mouseLocation: getMouseLocation(event, currentlyDraggedElement, currentlyHoveredDroppable, currentlyHoveredElement),
							currentlyHoveredElement : currentlyHoveredElement
						});
					}
				});
				// dragenter on the next element is fired *before* the dragleave of the previous element
				$(this).on("dragenter"+randomEventNamespace, function(event) {
					// .PreventDefault() is a means of saying that we accept the draggable
					event.preventDefault();
					event.stopPropagation();
					currentlyHoveredElement = $(event.target);
					// Check if we really entered a new hoveredDroppable. If so, fire an event and set new hoveredDroppable
					if (!currentlyHoveredElement.closest(droppables).is(currentlyHoveredDroppable)) {
						currentlyHoveredDroppable = $(event.originalEvent.currentTarget);
						options.onEnterDroppable(currentlyDraggedElement, currentlyHoveredDroppable, { 
							mouseLocation: getMouseLocation(event, currentlyDraggedElement, currentlyHoveredDroppable, currentlyHoveredElement),
							currentlyHoveredElement : currentlyHoveredElement
						});
					}
				});
				$(this).on("dragleave"+randomEventNamespace, function(event) {
					event.preventDefault();
					event.stopPropagation();
					// Check if we really left the hoveredDroppable. If so, fire an event
					// currentlyHoveredElement cannot be set here, since event.target does NOT contain the currently Hovered Element
					if (!$(currentlyHoveredElement).closest(options.droppables).is($(this))) {
						options.onLeaveDroppable(currentlyDraggedElement, $(this), { 
							mouseLocation: getMouseLocation(event, currentlyDraggedElement, $(this), currentlyHoveredElement),
							currentlyHoveredElement : currentlyHoveredElement
						});
					}
				});
				$(this).on("drop"+randomEventNamespace, function(event) {
					event.preventDefault();
					event.stopPropagation();
					elementWasDroppedSuccessfully = true;
					currentlyHoveredDroppable = $(event.originalEvent.currentTarget);
					currentlyHoveredElement = $(event.target);
					// Actual onDrop event will be thrown at dragEnd
				});
			});
		}

		function getMouseLocation(event, draggable, droppable, currentElement) {
			var mouseLocation = {};
			function delta(pos, within) {
				return { x: pos.x - within.left, y: pos.y - within.top };
			}
			mouseLocation.inDocument = { x: event.originalEvent.pageX, y: event.originalEvent.pageY };
			mouseLocation.inDraggable = (draggable ? delta(mouseLocation.inDocument, draggable.offset()) : null);
			mouseLocation.inDroppable = (droppable ? delta(mouseLocation.inDocument, droppable.offset()) : null);
			mouseLocation.inCurrentElement = (currentElement ? delta(mouseLocation.inDocument, currentElement.offset()) : null);
			return mouseLocation;
		}

		function unRegisterDraggables(draggablesToUnregister) {
			draggablesToUnregister = draggablesToUnregister || draggables;
			// Remove attributes and event-listeners
			draggablesToUnregister.each(function() {
				this.draggable = false;
				$(this).off(randomEventNamespace);
			});
		}

		function unRegisterDroppables(droppablesToUnregister) {
			droppablesToUnregister = droppablesToUnregister || droppables;
			// Remove event-listeners
			droppables.each(function() {
				$(this).off(randomEventNamespace);
			});
		}

		// - Return functions object
		returnFunctions = {
			stop : function() {
				unRegisterDraggables();
				unRegisterDroppables();
			},
			update : function() {
				unRegisterDraggables();
				unRegisterDroppables();
				draggables = root.find(options.draggables);
				droppables = root.find(options.droppables);
				initDraggables();
				initDroppables();
			},
			getRoot : function() {
				return root;
			}
		};
		root.data("jquery-html5dragdrop", returnFunctions);

	});

	return returnFunctions;
};