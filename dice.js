/* create a dic object with two methods
 * roll: returns a random roll 65-100
 * rollnatural: returns a random roll 1-100
 */
var dice = {
  sides: 100,
  roll: function ()
  {
    var randomNumber = Math.floor(Math.random() * (100 - 65)) + 65;
    return randomNumber;
  },
  naturalroll: function ()
  {
    var randomNumber = Math.floor(Math.random() * this.sides) + 1;
    return randomNumber;
  }
}

/*
 * generate a guid, this should be considered non-secure as its not necessarily
 * truly random and can be tampered with since its client side.
 * in our case, we just need something pseudo-unique
 */
function uuidv4()
{
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// worker function for random number generator
function getRndInteger(min, max)
{
  return Math.floor(Math.random() * (max - min)) + min;
}

//Prints dice roll to the page
function updateUI(elementId, value)
{
  var element = document.getElementById(elementId);
  element.innerHTML = value;
}

/*
 * helper function to set a cookie to some specific value
 */
function setCookieValue(cookieName, value, expiryDays)
{
  const d = new Date();
  d.setTime(d.getTime() + (expiryDays*24*60*60*1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cookieName + "=" + value + ";" + expires + ";path=/";
}

/*
 * helper function to get the value of the cookie
 */
function getCookieValue(cookieName)
{
  let name = cookieName + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let cookieArry = decodedCookie.split(';');

  // search through the string array that is the cookie
  for(let i = 0; i < cookieArry.length; i++)
  {
    let c = cookieArry[i];
    while (c.charAt(0) == ' ')
    {
      c = c.substring(1);
    }
    // if we have a match then return the value
    if (c.indexOf(name) == 0)
    {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}


/*
 * check for a cookie, if not set then initialize
 */
function checkAndSetCookie()
{
    // get the cookie value
    let cookieValue = getCookieValue("dice");
    // if its not set then initialize to a pseudo random value for this browser
    // otherwise use what was previously set
    if (cookieValue != "")
    {
        // return what we have
        return cookieValue;
    }
    else
    {
         // set a value
         let guid = uuidv4();
         setCookieValue("dice", guid, 7);
         return guid;
    }
}

// get the button and register the click event
var button = document.getElementById('button');

button.onclick = function()
{
    // call the random number generation in javascript
    //var die = dice.naturalroll();
    //updateDie(die, 'die');

    // change the css of the die element to turn animation on
    var element = document.getElementById("die");
    element.className="tile appearance shadow-animate";

    // start a timer, when the timer hits zero change the animations off
    var timeleft = 5;

    // timer runs every second asynchronously
    // when the timer hits zero the animations are disabled and the timer cleared
    var downloadTimer = setInterval(
        function function1()
        {
            timeleft -= 1;
            if(timeleft <= 0)
            {
                clearInterval(downloadTimer);

                var element = document.getElementById("die");
                element.className="tile appearance";
            }
        },
        1000
    );

    // get this browsers pseudo-unique id
    let browserId = checkAndSetCookie();

    // call the random number generation in PHP first
    var input = { action: 'natural_roll', browserId: browserId };

    $.post(
        "https://www.itsmetor.com/dice/dice.php",
        input,
        function(response)
        {
            if(response != "")
            {
                // natural roll success, update the UI
                updateUI("die", response);

                // now that data is generated, fetch the history and avg async
                input = { action: 'get_history', browserId: browserId };

                $.post(
                    "https://www.itsmetor.com/dice/dice.php",
                    input,
                    function(response)
                    {
                        if(response != "")
                        {
                            // history fetch success, or possible PHP error
                            // update the UI
                            updateUI("history", response);
                        }
                        else
                        {
                            // history fetch error in PHP, log to console for debug
                            console.log('Error, fetching history...');
                        }
                    }
                );

                // avg can fetch same time as get history since data is already created
                input = { action: 'get_average', browserId: browserId };
                $.post(
                    "https://www.itsmetor.com/dice/dice.php",
                    input,
                    function(response)
                    {
                        if(response != "")
                        {
                            // avg fetch success or possible PHP error
                            // update the UI
                            updateUI("average", "Avg: " + response);
                        }
                        else
                        {
                            // avg calc error in PHP, log to console for debug
                            console.log('Error, fetching average...');
                        }
                    }
                );
            }
            else
            {
                // natural roll error, log to console for debug
                console.log('Error, fetching roll');
            }
        }
    );

};
