// Initial feeds (when user install extension)
"use strict";

var RR = RR || {};

RR.initial = [
    {
        "items": [
            {
                "text": "Sample feeds",
                "items": [
                    {
                        "text": "XKCD",
                        "url": "http://xkcd.com/atom.xml"
                    },
                    {
                        "text": "slashdot.org",
                        "url": "http://rss.slashdot.org/Slashdot/slashdot"
                    },
                    {
                        "text": "HN",
                        "url": "https://news.ycombinator.com/rss"
                    },
                    {
                        "text": "NASA picture of the day",
                        "url": "http://antwrp.gsfc.nasa.gov/apod.rss"
                    }
                ],
                "closed": false
            }
        ],
        "text": "All feeds",
        "closed": false
    }
];
