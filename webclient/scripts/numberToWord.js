var groupedMapping = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion',
            'Septillion', 'Octillion', "Nonillion", 'Decillion', 'Undecillion', 'Duodecillion', 'Tredecillion',
            'Quattuordecillion', 'Quindecillion', 'Sexdecillion', 'Septendecillion', 'Octodecillion', 'Novemdecillion',
            'Vigintillion', 'Unvigintillion', 'Duovigintillion', '10^72', '10^75', '10^78', '10^81', '10^84', '10^87',
            'Vigintinonillion', '10^93', '10^96', 'Duotrigintillion', 'Trestrigintillion'];
var onesMapping = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']; 
var tensMapping = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
var twentiesMapping = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numbersToWord(amtNum, naira, kobo)
{
    var s = amtNum.toString();
    s = s.replace(/[\, ]/g, '');
    if (s != parseFloat(s))
        return 'not a number';
    var x = s.indexOf('.');
    if (x == -1) x = s.length;
    if (x > 15)
    {
        return amtNum;
    }
    var n = s.split('');
    var str = '';
    var sk = 0;
   
    for (var i = 0; i < x; i++) 
    {
        if ((x - i) % 3 == 2)
        {
            if (n[i] == '1') 
            {
                str += tensMapping[Number(n[i + 1])] + ' '; 
                i++; sk = 1;
            }
            else if (n[i] != 0) 
            {
                str += twentiesMapping[n[i] - 2] + ' '; 
                sk = 1;
            }
        }
        
        else if (n[i] != 0)
        {
            str += onesMapping[n[i]] + ' ';
            if ((x - i) % 3 == 0 && s[1] == 0 && s[2] == 0) str += 'Hundred ';
            if ((x - i) % 3 == 0 && s[1] == 0 && s[2] != 0) str += 'Hundred ';
            if ((x - i) % 3 == 0 && s[1] != 0 && s[2] != 0) str += 'Hundred and ';
            if ((x - i) % 3 == 0 && s[1] != 0 && s[2] == 0) str += 'Hundred and ';
            sk = 1;
        }

        if ((x - i) % 3 == 1) 
        {
            if (sk) str += groupedMapping[(x - i - 1) / 3] + ' ';
            sk = 0;
        }
        
    }

    if (x != s.length) 
    {
        var y = s.length;
        str += naira + ' ';
        for (var j = x + 1; j < y; j++) str += onesMapping[n[j]] + ' ' + kobo + ' ';
    }

    if (x = s.length) {
        var r = s.length;
        str += ' ';
        for (var k = x + 1; k < r; k++) str += onesMapping[n[k]] + ' ';
    }

    var newString = "";
    
    if (str.length > 6) 
    {
            if (str.charAt(str.length - 7) == ' ' && str.charAt(str.length - 6) == 'a'
            && str.charAt(str.length - 5) == 'n' && str.charAt(str.length - 4) == 'd' && str.charAt(str.length - 3) == ' ') 
            {
                var substring = str.substring(0, str.length - 6);
                return substring;
            }
            else 
            {

                if (newString.charAt(newString.length - 5) == ' ' && newString.charAt(newString.length - 4) == 'a'
                && newString.charAt(newString.length - 3) == 'n' && newString.charAt(newString.length - 2) == 'd' && newString.charAt(newString.length - 1) == ' ')
                {
                    var substring1 = newString.substring(0, str.length - 6);
                    return substring1;
                }
                else 
                {
                    return str;
                }
                
            }
            
        }
    
        return str;
   
}