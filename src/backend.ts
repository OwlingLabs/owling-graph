import { near, BigInt, JSONValue, json, ipfs, log, TypedMap, Value, typeConversion, BigDecimal, bigInt, bigDecimal } from "@graphprotocol/graph-ts"
import { Form, Submit_form } from "../generated/schema"

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
  if (methodName == 'create_form') {
    if(outcome.logs.length > 0) {  
      //obtenemos la primera iteracion del log
      const outcomeLog = outcome.logs[0].toString();
      
      //convirtiendo el log en un objeto ValueJSON
      let outcomelogs = json.try_fromString(outcomeLog);
    
      //validamos que se cree un objeto tipo ValueJSON valido a partir del log capturado
      if(!outcomelogs.isOk) return

      const data = outcomelogs.value.toObject();
      
      if(!data) return
    
      const id_form = data.get('id')
      const creator = data.get('creator')
      const title = data.get('title')
      const creation = data.get('creation')
      const questions = data.get('questions')
      const possibly_answers = data.get('possibly_answers')
      const results = data.get('results')

      //validando que los parametros a consultar en el log existan
      if (!id_form || !creator || !title || !creation || !questions || !possibly_answers  || !results) return

      let id = id_form.toString()

      let form = Form.load(id)
      //validando que el id formolario no exista para agregarlo
      if(!form) { 
        //convirtiendo questions Vec<String> en String
        let var_questions = '['
        for(let i = 0; i < questions.toArray().length; i++){
          var_questions += '"'+questions.toArray()[i].toString()+'"'
          if(i < questions.toArray().length - 1) {
            var_questions += ','
          }
        }
        var_questions += ']'

        //convirtiendo possibly_answers Vec<Vec<String>> en String
        //recorriendo el primer vector
        let var_possibly_answers = '['
        const data_pa = possibly_answers.toArray()
        for(let i = 0; i < data_pa.length; i++){
          let data = data_pa[i].toArray()
          let sub_var_possibly_answers = '['
          //recorriendo el segundo vector
          for(let j = 0; j < data.length; j++){
            sub_var_possibly_answers += '"'+data[j].toString()+'"'
            if(j < data.length - 1) {
              sub_var_possibly_answers += ','
            }
          }
          sub_var_possibly_answers += ']'
          //agregando resultdos obtenidos en el segundo vector
          var_possibly_answers += sub_var_possibly_answers
          if(i < data_pa.length - 1) {
            var_possibly_answers += ','
          }
        }
        var_possibly_answers += ']'

        //convirtiendo var_results Vec<String> en String
        let var_results = '['
        for(let i = 0; i < results.toArray().length; i++){
          var_results += '"'+results.toArray()[i].toString()+'"'
          if(i < results.toArray().length - 1) {
            var_results += ','
          }
        }
        var_results += ']'

        //se crea un nevo espacion en memoria de Form asociado al id y se guardan los datos
        form = new Form(id)
        form.creator = creator.toString()
        form.title = title.toString()
        form.creation = creation.toString()
        form.questions = var_questions
        form.possibly_answers = var_possibly_answers
        form.results = var_results
        form.fecha = BigInt.fromU64(blockHeader.timestampNanosec)
        form.nft_quantity = BigInt.fromString("0")
        form.save()
      }

    }
  }


  //este evento es disparado cuando el metodo el submit_form
  if (methodName == 'submit_form') {
    if(outcome.logs.length > 0) {  
      //obtenemos la primera iteracion del log
      const outcomeLog = outcome.logs[0].toString();
      
      //convirtiendo el log en un objeto ValueJSON
      let outcomelogs = json.try_fromString(outcomeLog);
    
      //validamos que se cree un objeto tipo ValueJSON valido a partir del log capturado
      if(!outcomelogs.isOk) return

      const data = outcomelogs.value.toObject();
      
      if(!data) return
      
      const id_submit = data.get('id')
      const form_id = data.get('form_id')
      const wallet_id = data.get('wallet_id')
      const answers = data.get('answers')
      const total_points = data.get('total_points')
      const final_result = data.get('final_result')
      const final_image = data.get('final_image')

      //validando que los parametros a consultar en el log existan
      if (!id_submit || !form_id || !wallet_id || !answers || !total_points || !final_result || !final_image) return

      let id = id_submit.toString()

      let submit_form = Submit_form.load(id)
      //validando que el id formolario no exista para agregarlo
      if(!submit_form) { 
        //convirtiendo answers Vec<String> en String
        let var_answers = '['
        for(let i = 0; i < answers.toArray().length; i++){
          var_answers += '"'+answers.toArray()[i].toString()+'"'
          if(i < answers.toArray().length - 1) {
            var_answers += ','
          }
        }
        var_answers += ']'

        //se crea un nevo espacion en memoria de Submit_form asociado al id y se guardan los datos
        submit_form = new Submit_form(id)
        submit_form.wallet_id = wallet_id.toString()
        submit_form.form_id = form_id.toString()
        submit_form.answers = var_answers
        submit_form.total_points = total_points.toString()
        submit_form.final_result = final_result.toString()
        submit_form.final_image = final_image.toString()
        submit_form.fecha = BigInt.fromU64(blockHeader.timestampNanosec)
        submit_form.save()
      }

    }
  }



}