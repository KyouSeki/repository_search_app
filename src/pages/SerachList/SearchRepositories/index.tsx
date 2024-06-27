import React, { useEffect, useState, ChangeEvent } from 'react';
import { List, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { GetRepositoryQuery, GetRepositoryVariables, Repository } from '@/interface/SearchRepositories'
import { FormItem } from '@/pages/SerachList/components/FormLine'
import { LoadMore } from '@/pages/SerachList/components/LoadMore'
import { GET_REPOSITORY_BY_QUERY } from '@/api'

function SearchRepositories(): React.ReactElement {
  const [nodes, setNodes] = useState<any>([])
  const [query, setQuery] = useState<GetRepositoryVariables>({name:'', after:''})
  const [hasNextPage, setHasNextPage] = useState<boolean>(true)
  const count: number = 10
  const [getRepository,
    {fetchMore, loading, error, data} ] = useLazyQuery<GetRepositoryQuery, GetRepositoryVariables>(GET_REPOSITORY_BY_QUERY);

  useEffect(()=>{
    if(data){
      setNodes(data.search.nodes)
      setHasNextPage (data.search.pageInfo.hasNextPage)
      setQuery({...query, after: data.search.pageInfo?.endCursor})
    }
  },[data])

  if (error) return <p>Error : {error.message}</p>;

  const getDatas = (name?:string) =>{
    if(name){
      setQuery({...query, name: name})
      getRepository({ variables: {name:name, first: count}})
    }else{
      getRepository({ variables: {name:query.name, first: count}})
    }
  }

  const resetData = () => {
    setQuery({name:'', after:''})
  }

  const textChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery({...query, name:event.target.value});
  };

  const loadMoreFetch = ():void => {
    if (!data || !data.search) return;
    setNodes(
      [...nodes, ...Array.from({ length: count }, () => ({ loading: true }))]
    );
    fetchMore({
      variables: { name: query.name, after: query.after, first: count},
      updateQuery: (prev: GetRepositoryQuery, {fetchMoreResult}: any): GetRepositoryQuery => {
        if (!fetchMoreResult) return prev;
        return {
          search: {...fetchMoreResult.search, nodes:[...nodes, ...fetchMoreResult.search.nodes]}
        }
      },
    })
  }
  // 加载更多组件
  const loadMore: React.ReactElement | null =
    !loading && nodes.length > 0 && hasNextPage? (
      <LoadMore loadMoreFetchCallback={loadMoreFetch}/>
    ) : null;

  return (
    <div>
      <FormItem query={query} textChangeCallback={textChange} getDatas={getDatas} resetData={resetData}/>
      <List
        className="load-more-list"
        loading={loading}
        itemLayout="horizontal"
        loadMore={loadMore}
        dataSource={nodes ? nodes as Array<Repository> : []}
        renderItem={item => (
          <List.Item
            actions={[<a key="list-loadmore-more" href={item.url} target="_blank">more</a>]}
          >
            <Skeleton title={false} loading={item.loading} active>
              <List.Item.Meta
                title={<Link to={"/issues/" + item.id} className="list-title">{item.name}</Link>}
                description={item.description}
              />
            </Skeleton>
          </List.Item>
        )}
      />
    </div>
  )
}

export default SearchRepositories;