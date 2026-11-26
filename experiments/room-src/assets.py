import json, pathlib, urllib.request, urllib.parse, time, concurrent.futures
ROOT=pathlib.Path('public/assets-local')
ROOT.mkdir(parents=True,exist_ok=True)
def fetch(url):
    for n in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'LifeAfterLogic personal rendering experiment (GitHub Actions)'})
            with urllib.request.urlopen(req,timeout=45) as r:return r.read()
        except Exception:
            if n==2:raise
            time.sleep(2+n)
def api(id):return json.loads(fetch('https://api.polyhaven.com/files/'+id))
def write(p,data):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_bytes(data)
def model(id):
    data=api(id)
    entry=data['gltf'].get('2k') or data['gltf']['1k']
    src=entry['gltf']['url']
    dest=ROOT/id
    raw=fetch(src);doc=json.loads(raw)
    includes=entry['gltf'].get('include',{})
    for node in doc.get('buffers',[])+doc.get('images',[]):
        uri=node.get('uri','')
        if not uri or uri.startswith('data:'):continue
        local=urllib.parse.unquote(uri)
        name=pathlib.PurePosixPath(local).name
        info=includes.get(uri) or includes.get(local) or includes.get(name)
        url=info.get('url') if isinstance(info,dict) else None
        if not url:
            for k,v in includes.items():
                if pathlib.PurePosixPath(k).name==name and isinstance(v,dict):url=v.get('url');break
        url=url or urllib.parse.urljoin(src,uri)
        write(dest/name,fetch(url))
        node['uri']=name
    write(dest/'model.gltf',json.dumps(doc).encode())
    print('MODEL',id,flush=True)
    return './assets-local/'+id+'/model.gltf'
def texture(id):
    data=api(id);out={}
    for key,opts in [('diff',['Diffuse','diff']),('nor',['nor_gl','Normal GL']),('rough',['Rough','rough'])]:
        for opt in opts:
            if opt in data:
                res=data[opt].get('2k') or data[opt].get('1k') or {}
                fmt=res.get('jpg') or res.get('png')
                if fmt:
                    ext='jpg' if res.get('jpg') else 'png'
                    name=key+'.'+ext
                    write(ROOT/id/name,fetch(fmt['url']))
                    out[key]='./assets-local/'+id+'/'+name
                break
    print('TEXTURE',id,list(out),flush=True)
    return out
manifest={'models':{},'textures':{}}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    tasks={pool.submit(model,id):('models',id) for id in ['modern_arm_chair_01','modern_coffee_table_01','ceramic_vase_04','potted_plant_02']}
    tasks.update({pool.submit(texture,id):('textures',id) for id in ['wood_floor','white_plaster_02','fabric_pattern_07']})
    for f in concurrent.futures.as_completed(tasks):
        cat,id=tasks[f]
        try:manifest[cat][id]=f.result()
        except Exception as e:print('Asset failed:',id,repr(e),flush=True)
write(ROOT/'manifest.json',json.dumps(manifest,indent=2).encode())
# A real furniture asset is essential; don't silently ship a primitive-only scene.
assert all(k in manifest['models'] for k in ['modern_arm_chair_01','modern_coffee_table_01']), 'Critical textured furniture failed to download'
