---
title: "Dimona indienen: procedure (Staffing)"
source: sharepoint
path: /sites/Staffing-BE/Documenten/Procedures/Dimona procedure.pdf
created: 2024-08-20
modified: 2026-09-26
modifiedBy: svc-template-migration@sdworx.example
---

# Dimona indienen: procedure (Staffing)

Staffing België

## Wat is Dimona

Dimona (Déclaration Immédiate / Onmiddellijke Aangifte) is de elektronische aangifte aan de RSZ van elke in- en uitdiensttreding. Zonder Dimona is een werknemer niet aangegeven, ook al staat hij in de loonadministratie.

## Termijnen

| Aangifte      | Wanneer                                                          |
| ------------- | ---------------------------------------------------------------- |
| Dimona IN     | Ten laatste op het moment dat de werknemer begint te werken      |
| Dimona OUT    | Ten laatste de eerste werkdag na het einde van de tewerkstelling |
| Dimona UPDATE | Zodra een gegeven wijzigt (bijvoorbeeld de einddatum)            |
| Dimona CANCEL | Als de tewerkstelling niet doorgaat, zo snel mogelijk            |

Een laattijdige of ontbrekende Dimona is een sanctie van niveau 4 in het Sociaal Strafwetboek. Daarnaast kan de RSZ een solidariteitsbijdrage vorderen.

## Standaardprocedure (werknemerstype OTH)

Voor gewone bedienden en arbeiders gebruiken we het werknemerstype **OTH**.

1. De klant geeft de nieuwe werknemer door via het klantenportaal of per mail, met rijksregisternummer, startdatum, paritair comité en statuut.
2. Maak de werknemer aan in de loonmotor (Werknemers > Nieuw).
3. Vul de contractgegevens in. Het veld **Startdatum** bepaalt de datum van de Dimona IN.
4. Klik op **Opslaan en aangeven**. De Dimona IN vertrekt automatisch naar het portaal van de sociale zekerheid.
5. Controleer binnen 15 minuten de status in **Aangiften > Dimona**:
   - Groen (aanvaard): klaar. Het Dimona-nummer staat in de werknemersfiche.
   - Oranje (in behandeling): later opnieuw controleren.
   - Rood (geweigerd): lees de foutcode, corrigeer en verstuur opnieuw.
6. Bevestig aan de klant per mail dat de Dimona aanvaard is en vermeld het Dimona-nummer.

## Studenten (werknemerstype STU)

Voor studenten met een studentenovereenkomst gebruiken we **STU**.

- De student heeft een contingent van 650 uren per kalenderjaar met verminderde solidariteitsbijdrage.
- De Dimona STU wordt per kwartaal ingediend, met het aantal geplande uren in dat kwartaal. Worden het meer uren, dien dan een UPDATE in voor de start van de extra prestaties.
- De student kan zijn resterende uren zelf opvolgen via Student@work. Vraag bij twijfel een attest van de student.
- Wordt het contingent overschreden, dan zijn op de extra uren gewone RSZ-bijdragen verschuldigd.

## Flexi-jobs (werknemerstype FLX)

- Enkel mogelijk als de werknemer in het kwartaal T-3 minstens 4/5 tewerkgesteld was bij een andere werkgever, of gepensioneerd is.
- Er moet een raamovereenkomst zijn voor de eerste prestatie.
- Dien per prestatie een Dimona FLX in met het begin- en einduur, of per kwartaal als de uren vooraf vastliggen.
- Controleer of de sector van de klant flexi-jobs toelaat. Bij twijfel het Legal kenniscentrum contacteren.

## Last minute aanvraag

Belt een klant op de dag zelf voor een werknemer die al gestart is of binnen het uur start:

1. Vraag minimaal rijksregisternummer, startdatum en paritair comité. De rest kan later.
2. Dien de Dimona IN manueel in via het portaal van de sociale zekerheid met het RSZ-nummer van de klant.
3. Maak de werknemer daarna aan in de loonmotor en koppel het Dimona-nummer manueel (veld **Dimona extern**), zodat er geen tweede aangifte vertrekt.

## Uitdiensttreding

1. Vul in de werknemersfiche de einddatum en de reden van uitdiensttreding in.
2. De Dimona OUT vertrekt bij het opslaan.
3. Controleer de status zoals bij de Dimona IN.

## Veelvoorkomende foutcodes

| Code  | Betekenis                                  | Oplossing                                                   |
| ----- | ------------------------------------------ | ----------------------------------------------------------- |
| 00913 | Rijksregisternummer ongeldig               | Nummer controleren met de klant                             |
| 90017 | Overlapping met een bestaande Dimona       | Bestaande aangifte opzoeken, UPDATE in plaats van nieuwe IN |
| 00011 | Paritair comité niet geldig voor werkgever | PC in de klantenfiche nakijken                              |

## Wat we niet doen

- Een Dimona indienen zonder schriftelijke vraag van de klant.
- Een Dimona IN met een startdatum in het verleden indienen zonder de teamlead te verwittigen.
