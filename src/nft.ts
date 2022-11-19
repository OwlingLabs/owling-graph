import { near, BigInt, JSONValue, json, ipfs, log, TypedMap, Value, typeConversion, BigDecimal, bigInt, bigDecimal } from "@graphprotocol/graph-ts"
import { Form, Nft } from "../generated/schema"

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const actions = receipt.receipt.actions;
  for (let i = 0; i < actions.length; i++) {
    handleAction(
      actions[i], 
      receipt.receipt, 
      receipt.outcome,
      receipt.block.header
    );
  }
}

//const list_contract_atributos_referencia = [];


function handleAction(
  action: near.ActionValue,
  receipt: near.ActionReceipt,
  outcome: near.ExecutionOutcome,
  blockHeader: near.BlockHeader
): void {
    
  if (action.kind != near.ActionKind.FUNCTION_CALL) return;
  
  const data = action.toFunctionCall();

  //se obtiene el nombre del metodo que fue ejecutado en el smart contract
  const methodName = action.toFunctionCall().methodName;
  
  //este evento es disparado cuando el metodo es create_form
  if (methodName == 'nft_mint') {  
    if(outcome.logs.length > 0) {
      //obtenemos la primera iteracion del log
      const outcomeLog = outcome.logs[0].toString();
      const parsed = outcomeLog.replace('EVENT_JSON:', '')  
      //convirtiendo el log en un objeto ValueJSON
      let outcomelogs = json.try_fromString(parsed);
    
      //validamos que se cree un objeto tipo ValueJSON valido a partir del log capturado
      if(!outcomelogs.isOk) return

      const jsonlog = outcomelogs.value.toObject();
      
      const eventData = jsonlog.get('data')
      if (!eventData) return
      
      const eventArray:JSONValue[] = eventData.toArray()

      const data = eventArray[0].toObject()
      const tokenIds = data.get('token_ids')
      const owner_id = data.get('owner_id')
      const metadatalog = data.get('metadata')
      
      if (!tokenIds || !owner_id || !metadatalog) return
      
      const ids:JSONValue[] = tokenIds.toArray()
      const tokenId = ids[0].toString()
      
      //convertimos la variable metadata en un objeto para poder acceder a sus variebles internas
      const metadata = metadatalog.toObject()

      //en caso de que no se transformable en un objeto se detiene la funcion
      if(!metadata) return

      //declaramos las variables dentro del objeto metadata
      const title = metadata.get('title')
      const description = metadata.get('description')
      const media = metadata.get('media')
      const form_id = metadata.get('reference')

      //se verifica que todas las variables que necesitamos existan en el objeto metadata
      if(!title || !description || !media || !form_id) return

      //buscamos si existe un token id
      let nft = Nft.load(tokenId)
      //validando que el token id no exista para agregarlo
      if(!nft) { 
        //se crea un nevo espacion en memoria de Form asociado al id y se guardan los datos
        nft = new Nft(tokenId)
        nft.token_id = tokenId
        nft.owner_id = owner_id.toString()
        nft.title = title.toString()
        nft.description = description.toString()
        nft.media = media.toString()
        nft.form_id = form_id.toString()
        nft.fecha = BigInt.fromU64(blockHeader.timestampNanosec)
        nft.save()
      }

      let form = Form.load(form_id.toString())
      if(form) {
        form.nft_quantity = form.nft_quantity.plus(BigInt.fromString("1"))
        form.save()
      }

    }
  }


  



}