/**
 * EngiVault Commands
 * Handles ribbon button commands
 */

Office.onReady(() => {
  // Commands are ready
});

/**
 * Shows the task pane
 */
function showTaskpane(event) {
  // The task pane is shown via manifest configuration
  // This function is called when the ribbon button is clicked
  event.completed();
}

// Register command functions
Office.actions.associate("showTaskpane", showTaskpane);

