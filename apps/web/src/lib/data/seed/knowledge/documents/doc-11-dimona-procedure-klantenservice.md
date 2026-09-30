---
title: "Dimona indienen: procedure"
source: sharepoint
path: /sites/CS-Belgium/Shared Documents/Werkinstructies/Dimona procedure.pdf
created: 2024-05-13
modified: 2026-09-23
modifiedBy: svc-template-migration@sdworx.example
---

# Dimona indienen: procedure

Klantenservice kmo | Payroll for kmo

Eigenaar: Bram Claessens. Laatst nagekeken: 1 september 2025.

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
2. Maak de werknemer aan in Payroll for kmo (Werknemers > Nieuw).
3. Vul de contractgegevens in. Het veld **Startdatum** bepaalt de datum van de Dimona IN.
4. Klik op **Opslaan en aangeven**. Payroll for kmo stuurt de Dimona IN automatisch naar het portaal van de sociale zekerheid.
5. Controleer binnen 15 minuten de status in **Aangiften > Dimona**:
   - Groen (aanvaard): klaar. Het Dimona-nummer staat in de werknemersfiche.
   - Oranje (in behandeling): later opnieuw controleren.
   - Rood (geweigerd): lees de foutcode, corrigeer en verstuur opnieuw.
6. Bevestig aan de klant per mail dat de Dimona aanvaard is en vermeld het Dimona-nummer.

## Last minute aanvraag

Belt een klant op de dag zelf voor een werknemer die al gestart is of binnen het uur start:

1. Vraag minimaal rijksregisternummer, startdatum en paritair comité. De rest kan later.
2. Dien de Dimona IN manueel in via het portaal van de sociale zekerheid met het RSZ-nummer van de klant (toegang via de SD Worx mandaten).
3. Maak de werknemer daarna aan in Payroll for kmo en koppel het Dimona-nummer manueel (veld **Dimona extern**), zodat er geen tweede aangifte vertrekt.

## Uitdiensttreding

1. Vul in de werknemersfiche de einddatum en de reden van uitdiensttreding in.
2. Payroll for kmo stuurt de Dimona OUT bij het opslaan.
3. Controleer de status zoals bij de Dimona IN.

## Veelvoorkomende foutcodes

| Code  | Betekenis                                  | Oplossing                                                   |
| ----- | ------------------------------------------ | ----------------------------------------------------------- |
| 00913 | Rijksregisternummer ongeldig               | Nummer controleren met de klant                             |
| 90017 | Overlapping met een bestaande Dimona       | Bestaande aangifte opzoeken, UPDATE in plaats van nieuwe IN |
| 00011 | Paritair comité niet geldig voor werkgever | PC in de klantenfiche nakijken                              |

## Wat we niet doen

- Een Dimona indienen zonder schriftelijke vraag van de klant (mail volstaat, ook achteraf bij een last minute aanvraag).
- Een Dimona IN met een startdatum in het verleden indienen zonder de teamlead te verwittigen. Dat is een laattijdige aangifte en moet gedocumenteerd worden.

Vragen: kanaal CS Belgium / Algemeen of Bram Claessens.
