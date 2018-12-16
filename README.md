# Indexed DB File Loader

This Is A Library For Load Scripts And Styles From Server And It Will Catched In Indexed DB.When You Load Next Time Your Website Scripts And Styles Will Load From Indexed DB

## Getting Started

Just Copy IndexedScript.js from dist folder And Add It In Your Project
  
### Prerequisites

It's Just A Plain Vanila JS Library
It Will Works In Indexed DB Supported Browsers Only

```
Give examples
```

### Installing


1.Just Copy IndexedScript.js from dist folder And Add It In Your Project
2.Include This File In HTML Head
3.Create An JSON File Like below
```
{
    "fileConfig": {
        "scripts": [
            {
                "key": "jquery-ui",
                "dependent": [
                    "jquery"
                ],
                "filePath": "jquery-ui.min.js",
                "version": 1
            },
            {
                "key": "jquery",
                "dependent": [],
                "filePath": "jquery-3.3.1.js",
                "version": 1
            }
            
        ],
        "styles": [
            {
                "key": "bootstrap",
                "dependent": [],
                "filePath": "bootstrap.css",
                "version": 1
            }
        ]
    }
}
```
4.Mention This File Path In IndexedScript.js like Below
```
var IndexedFileLoader = (function () {
    var fileConfigPath = 'indexedLoader.json';
```
5.Now You Can Load Scripts And Styles
Note:
  1.In JSON File Key Should Be Unique
  2.You Can Enter Dependent By This Key

## Built With

* [vanilla js]
* [Indexed DB]


## Authors

* **Ramesh Singer** - *Initial work* - [PurpleBooth](https://github.com/rameshsinger)

See also the list of [contributors](https://github.com/rameshsinger/IndexedFileLoader/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* https://www.tutorialspoint.com Indexed DB Tutorial
* Inspiration From My Friend Mr.Vivek M

