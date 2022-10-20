
* Proposition
  * id (UUID? 16B. 64-bit integer? 8B)
  * creatorId (UUID? 16B/8B)
  * created (Timestamp 5-8B depending on fractional seconds)
  * text (UTF-8 String (compressed?) (average length 164?) 164B)
  ~ 185–204B.  So say 200B
* Recent propositions, say 10 propositions
  * (But would recent propositions be served from Dynamo anyway?)