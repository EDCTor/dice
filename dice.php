<?php

if(isset($_POST['action']))
{
    // get the pseudo unique browser ID that identifies the user
    // this is required to use the application
    $browserId = $_POST['browserId'];
    if (!isset($browserId))
    {
        echo "-2";
    }

    if ($_POST['action'] == "natural_roll")
    {
        $roll = naturalRoll();
        logRoll($roll, $browserId);
        echo $roll;
    }
    else if ($_POST['action'] == "get_history")
    {
        // get the history file contents into a string array
        $a = getHistory($browserId);
        echo implode(PHP_EOL, $a);
    }
    else if ($_POST['action'] == "get_average")
    {
        $avg = getAverage($browserId);
        echo $avg;
    }
    else
    {
        // invalid action type, return a value to indicate this
        echo "-1";
    }
}
else
{
    // invalid action, return an indicator for this
    echo "-1";
}

/*
 * a natural roll is a random number between 1 and 100
 */
function naturalRoll()
{
    $i = random_int(1,100);
    return $i;
}

/*
 * gets the history from the history file, newest first
 */
function getHistory($browserId)
{
    // read the contents of the file to a string array
    // by default the file is ordered oldest to newest
    $filename = ".history.txt";
    $a = file($filename, FILE_IGNORE_NEW_LINES);

    // track an array of only entries that match the browser Id
    $matching = array();

    // reverse the order so newest is first
    if (isset($a))
    {
        // filter the data to only this browser Id
        foreach($a as $value)
        {
            // break the log entry into the two parts: browser Id and value
            $logArry = explode(";", $value);

            // if the log entry matches this browser then return it
            if (count($logArry) == 2 &&
                isset($logArry[0]) &&
                isset($logArry[1]) &&
                $logArry[0] == $browserId)
            {
               array_push($matching, $logArry[1]);
            }
        }

        // reverse the log so newest is first
        $matching = array_reverse($matching);
    }

    return $matching;
}

/*
 * gets the 20 roll average, or whatever the history file saves
 * rounds to 2 digits
 */
function getAverage($browserId)
{
    // read the contents of the file to a string array
    // by default the file is ordered oldest to newest
    $filename = ".history.txt";
    $a = file($filename, FILE_IGNORE_NEW_LINES);

    $avg = 0;

    // iterate through the array calculating the average as we go
    if (isset($a))
    {
        $total = 0;
        $count = 0;

        foreach($a as $value)
        {
            // break the log entry into the two parts: browser Id and value
            $logArry = explode(";", $value);

            if (count($logArry) == 2 &&
                isset($logArry[0]) &&
                isset($logArry[1]) &&
                $logArry[0] == $browserId)
            {
                $total = $total + $logArry[1];
                $count = $count + 1;
                $avg = $total / $count;
            }
        }
    }

    return round($avg, 2);
}

/*
 * create the .history.txt file with permissions 660 apache apache
 * in the same directory as the php file
 */
function logRoll($roll, $browserId)
{
    // create a log entry
    $logEntry = $browserId . ";" . $roll;

    // read the contents of the file to a string array
    $filename = ".history.txt";
    $a = file($filename, FILE_IGNORE_NEW_LINES);

    // if the file is new, create an array of 1 element
    // if the file is more than 20 elements then drop the first and add to the end
    // if the file is not at 20 then append to the end
    if (!isset($a))
    {
        // array is not set, create a new empty array
        $a = array($logEntry);
    }
    else if (isset($a) && count($a) > 20)
    {
        // if the array has more than 20 elements shift all
        // elements by -1 position then add our new element to the 20th position
        array_shift($a);
        array_push($a, $logEntry);
    }
    else
    {
        // the array doesnt have 20 elements, add ours to the end
        array_push($a, $logEntry);
    }

    // write the array to the file, replace the file
    $fp = fopen($filename, "w");

    // lock the file before writing
    if(flock($fp, LOCK_EX))
    {
        // write the output stream
        foreach ($a as $line)
        {
            fwrite($fp, $line . PHP_EOL);
        }

        // unlock the file
        flock($fp, LOCK_UN);
    }

    fclose($fp);
}

?>